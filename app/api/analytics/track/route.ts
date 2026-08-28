import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const path = String(body?.path || req.nextUrl.pathname || "/").slice(0, 200);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  try {
    await prisma.pageView.create({ data: { path, ip } });
  } catch {
    // не блокируем пользователя ошибкой трекинга
  }

  return NextResponse.json({ ok: true });
}
