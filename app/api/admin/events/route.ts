import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

const CATEGORIES = ["GOLD", "OIL", "CURRENCY", "CRYPTO", "RATES", "OTHER"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { forecasts: true, payments: true } },
    },
  });
  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      titleEn: e.titleEn,
      category: e.category,
      price: Number(e.price.toString()),
      currency: e.currency,
      currentPrice: e.currentPrice ? Number(e.currentPrice.toString()) : null,
      status: e.status,
      closesAt: e.closesAt,
      forecastCount: e._count.forecasts,
      paymentCount: e._count.payments,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const category = String(body?.category || "");
  const price = Number(body?.price);
  const currentPrice = body?.currentPrice !== null && body?.currentPrice !== undefined && body?.currentPrice !== "" ? Number(body.currentPrice) : null;

  if (!title || !description || !CATEGORIES.includes(category) || !(price > 0)) {
    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  }

  let slug = slugify(String(body?.titleEn || "") || title);
  if (!slug) slug = "event";
  const exists = await prisma.event.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const closesAt = body?.closesAt ? new Date(String(body.closesAt)) : null;

  const event = await prisma.event.create({
    data: {
      slug,
      title,
      titleEn: body?.titleEn ? String(body.titleEn).trim() : null,
      description,
      descriptionEn: body?.descriptionEn ? String(body.descriptionEn).trim() : null,
      category: category as never,
      imageUrl: String(body?.imageUrl || "").trim() || null,
      price,
      currency: String(body?.currency || "EUR").toUpperCase().slice(0, 3),
      currentPrice: currentPrice !== null && isFinite(currentPrice) ? currentPrice : null,
      closesAt: closesAt && !isNaN(closesAt.getTime()) ? closesAt : null,
    },
  });

  return NextResponse.json({ event: { id: event.id, slug: event.slug } }, { status: 201 });
}
