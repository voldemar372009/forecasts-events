import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateForecast } from "@/lib/ai";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const forecast = await prisma.forecast.findUnique({ where: { id: params.id } });
  if (!forecast) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const isOwner = forecast.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (forecast.status !== "FAILED") {
    return NextResponse.json({ error: "notFailed" }, { status: 400 });
  }

  await prisma.forecast.update({
    where: { id: forecast.id },
    data: { status: "PENDING", errorMessage: null },
  });
  void generateForecast(forecast.id);
  return NextResponse.json({ ok: true });
}
