import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { forecasts: true, payments: true } },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      blocked: u.blocked,
      forecastCount: u._count.forecasts,
      paymentCount: u._count.payments,
      createdAt: u.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "invalidData" }, { status: 400 });

  if (id === user.id) {
    return NextResponse.json({ error: "selfModify" }, { status: 400 });
  }

  const role = body?.role === "ADMIN" || body?.role === "USER" ? (body.role as "ADMIN" | "USER") : undefined;
  const blocked = typeof body?.blocked === "boolean" ? body.blocked : undefined;

  if (role === undefined && blocked === undefined) {
    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "notFound" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(blocked !== undefined ? { blocked } : {}),
    },
    select: { id: true, email: true, name: true, role: true, blocked: true },
  });

  return NextResponse.json({ user: updated });
}
