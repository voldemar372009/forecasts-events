import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "notFound" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const title = body?.title !== undefined ? String(body.title).trim() : event.title;
  const description = body?.description !== undefined ? String(body.description).trim() : event.description;

  const data: Record<string, unknown> = { title, description };
  if (body?.titleEn !== undefined) data.titleEn = String(body.titleEn).trim() || null;
  if (body?.descriptionEn !== undefined) data.descriptionEn = String(body.descriptionEn).trim() || null;
  if (body?.category !== undefined) data.category = String(body.category);
  if (body?.imageUrl !== undefined) data.imageUrl = String(body.imageUrl).trim() || null;
  if (body?.price !== undefined) data.price = Number(body.price);
  if (body?.currency !== undefined) data.currency = String(body.currency).toUpperCase().slice(0, 3);
  if (body?.currentPrice !== undefined && body.currentPrice !== null && body.currentPrice !== "") {
    data.currentPrice = Number(body.currentPrice);
  } else if (body?.currentPrice !== undefined) {
    data.currentPrice = null;
  }
  if (body?.closesAt !== undefined) {
    const d = body.closesAt ? new Date(String(body.closesAt)) : null;
    data.closesAt = d && !isNaN(d.getTime()) ? d : null;
  }

  const updated = await prisma.event.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const count = await prisma.forecast.count({ where: { eventId: params.id } });
  if (count > 0) {
    return NextResponse.json({ error: "hasForecasts" }, { status: 409 });
  }
  await prisma.event.delete({ where: { id: params.id } }).catch(() => {
    throw new Error("delete failed");
  });
  return NextResponse.json({ ok: true });
}
