import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getStripe, amountInCents } from "@/lib/stripe";
import { generateForecast } from "@/lib/ai";
import { isLocale } from "@/lib/i18n";
import { CATEGORIES, categoryImage, detectCategory } from "@/lib/categories";
import { getMarketQuote } from "@/lib/market";
import { slugify } from "@/lib/slugify";
import type { Event } from "@prisma/client";

const DAY = 86400000;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const targetDateRaw = String(body?.targetDate || "");
  const locale = isLocale(String(body?.locale || "ru")) ? String(body.locale) : "ru";
  const isCustom = Boolean(body?.custom);

  // Событие: либо существующее из каталога, либо созданное посетителем
  let event: Event;
  if (isCustom) {
    const title = String(body?.title || "").trim();
    const detected = detectCategory(title);
    const category = detected ?? String(body?.category || "OTHER");
    if (title.length < 2 || title.length > 80) {
      return NextResponse.json({ error: "nameRequired" }, { status: 400 });
    }
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: "invalidCategory" }, { status: 400 });
    }
    // Реальная цена с рынка (если источник найден) — авторитетнее введённой вручную
    const quote = await getMarketQuote(title).catch(() => null);
    let currentPrice = Number(body?.currentPrice);
    let chartData: unknown = null;
    if (quote) {
      currentPrice = quote.price;
      chartData = quote.history && quote.history.length > 1 ? quote.history : null;
    }
    if (!(currentPrice > 0) || !isFinite(currentPrice)) {
      return NextResponse.json({ error: "priceInvalid" }, { status: 400 });
    }
    const base = slugify(title) || "custom";
    let slug = base;
    let n = 0;
    while (await prisma.event.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    event = await prisma.event.create({
      data: {
        slug,
        title,
        titleEn: title,
        description: `Пользовательский прогноз по событию: ${title}`,
        descriptionEn: `Custom forecast for: ${title}`,
        category: category as never,
        imageUrl: categoryImage(category, title),
        price: 10,
        currency: "EUR",
        currentPrice,
        chartData: chartData ?? undefined,
        isCustom: true,
      },
    });
  } else {
    const eventSlug = String(body?.eventSlug || "");
    const found = await prisma.event.findUnique({ where: { slug: eventSlug } });
    if (!found || found.status !== "ACTIVE") {
      return NextResponse.json({ error: "eventNotFound" }, { status: 404 });
    }
    event = found;
  }

  const t = new Date(targetDateRaw);
  if (isNaN(t.getTime())) {
    return NextResponse.json({ error: "dateInvalid" }, { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(Date.now() + 365 * DAY);
  if (t.getTime() < today.getTime() || t.getTime() > max.getTime()) {
    return NextResponse.json({ error: "dateRange" }, { status: 400 });
  }

  const amount = Number(event.price.toString());
  const currency = (event.currency || "EUR").toLowerCase();
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    // Прогноз создаём сразу (PENDING) — генерация только после оплаты.
    const forecast = await prisma.forecast.create({
      data: {
        userId: user.id,
        eventId: event.id,
        targetDate: t,
        status: "PENDING",
        priceAtRequest: event.currentPrice,
      },
    });

    const stripe = getStripe();
    if (stripe) {
      const productImages = event.imageUrl && event.imageUrl.startsWith("http") ? [event.imageUrl] : undefined;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: event.title,
                ...(productImages ? { images: productImages } : {}),
              },
              unit_amount: amountInCents(amount),
            },
            quantity: 1,
          },
        ],
        metadata: { forecastId: forecast.id, userId: user.id },
        success_url: `${appUrl}/${locale}/dashboard?paid=1`,
        cancel_url: `${appUrl}/${locale}/events/${event.slug}`,
      });

      await prisma.payment.create({
        data: {
          userId: user.id,
          eventId: event.id,
          forecastId: forecast.id,
          stripeSessionId: session.id,
          amount,
          currency: event.currency,
          status: "PENDING",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Dev-обход (нет STRIPE_SECRET_KEY): сразу «оплачено» и генерируем прогноз.
    await prisma.payment.create({
      data: {
        userId: user.id,
        eventId: event.id,
        forecastId: forecast.id,
        stripeSessionId: "dev_" + forecast.id,
        amount,
        currency: event.currency,
        status: "PAID",
      },
    });
    void generateForecast(forecast.id);
    return NextResponse.json({ url: `${appUrl}/${locale}/forecast/${forecast.id}`, dev: true });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "checkoutFailed" }, { status: 500 });
  }
}
