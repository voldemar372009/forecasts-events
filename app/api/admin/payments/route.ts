import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      userEmail: p.user.email,
      eventTitle: p.event.title,
      eventSlug: p.event.slug,
      amount: Number(p.amount.toString()),
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
  });
}
