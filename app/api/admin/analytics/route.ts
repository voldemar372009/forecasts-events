import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const days = 30;
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [recent, topPages, totals] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, ip: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.pageView.count(),
  ]);

  // Построить по дням: views и unique visitors
  const byDay = new Map<string, { views: number; ips: Set<string> }>();
  for (const v of recent) {
    const d = v.createdAt.toISOString().slice(0, 10);
    const e = byDay.get(d) ?? { views: 0, ips: new Set<string>() };
    e.views += 1;
    if (v.ip) e.ips.add(v.ip);
    byDay.set(d, e);
  }

  const series: { date: string; views: number; visitors: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const e = byDay.get(key);
    series.push({ date: key, views: e ? e.views : 0, visitors: e ? e.ips.size : 0 });
  }

  return NextResponse.json({
    series,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count._all })),
    totalViews: totals,
  });
}
