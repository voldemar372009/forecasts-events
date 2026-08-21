import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

const CATEGORIES = ["GOLD", "OIL", "CURRENCY", "CRYPTO", "RATES", "OTHER"];

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "notFound" }, { status: 404 });

  return NextResponse.json({
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      titleEn: event.titleEn,
      description: event.description,
      descriptionEn: event.descriptionEn,
      category: event.category,
      imageUrl: event.imageUrl,
      price: Number(event.price.toString()),
      currency: event.currency,
      currentPrice: event.currentPrice ? Number(event.currentPrice.toString()) : null,
      status: event.status,
      closesAt: event.closesAt,
      isCustom: event.isCustom,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
  const exists = await prisma.event.findFirst({ where: { slug, NOT: { id: params.id } } });
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const closesAt = body?.closesAt ? new Date(String(body.closesAt)) : null;

  const event = await prisma.event.update({
    where: { id: params.id },
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

  return NextResponse.json({ event: { id: event.id, slug: event.slug } });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}