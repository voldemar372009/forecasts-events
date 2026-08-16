import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "notFound" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const actualPrice = Number(body?.actualPrice);
  if (!(actualPrice > 0)) {
    return NextResponse.json({ error: "invalidPrice" }, { status: 400 });
  }

  const forecasts = await prisma.forecast.findMany({
    where: { eventId: params.id, status: "READY", priceAtRequest: { not: null } },
    select: { id: true, direction: true, priceAtRequest: true },
  });

  const updates = forecasts.map((f) => {
    const request = Number(f.priceAtRequest!.toString());
    let isCorrect: boolean;
    if (f.direction === "UP") isCorrect = actualPrice >= request;
    else if (f.direction === "DOWN") isCorrect = actualPrice <= request;
    else isCorrect = Math.abs(actualPrice - request) / request < 0.01;
    return prisma.forecast.update({
      where: { id: f.id },
      data: { isCorrect },
    });
  });

  await prisma.$transaction([
    prisma.event.update({ where: { id: params.id }, data: { status: "CLOSED" } }),
    ...updates,
  ]);

  return NextResponse.json({ ok: true, resolved: updates.length });
}
