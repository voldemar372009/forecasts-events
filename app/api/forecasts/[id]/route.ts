import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(_req.url);
  const localeParam = url.searchParams.get("locale") || "ru";
  const locale = isLocale(localeParam) ? localeParam : "ru";
  const ru = locale === "ru";

  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { event: true, user: { select: { id: true, name: true } } },
  });

  if (!forecast) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const isOwner = forecast.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({
    forecast: {
      id: forecast.id,
      status: forecast.status,
      direction: forecast.direction,
      confidence: forecast.confidence,
      summary: ru ? forecast.summary : forecast.summaryEn ?? forecast.summary,
      keyLevels: forecast.keyLevels,
      chartData: forecast.chartData,
      targetDate: forecast.targetDate,
      priceAtRequest: forecast.priceAtRequest ? Number(forecast.priceAtRequest.toString()) : null,
      isCorrect: forecast.isCorrect,
      errorMessage: forecast.errorMessage,
      createdAt: forecast.createdAt,
      event: {
        slug: forecast.event.slug,
        title: ru ? forecast.event.title : forecast.event.titleEn ?? forecast.event.title,
        imageUrl: forecast.event.imageUrl,
        currency: forecast.event.currency,
        currentPrice: forecast.event.currentPrice
          ? Number(forecast.event.currentPrice.toString())
          : null,
      },
    },
  });
}
