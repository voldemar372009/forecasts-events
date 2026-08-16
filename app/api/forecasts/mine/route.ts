import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getUserStats } from "@/lib/data";
import { isLocale } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const localeParam = req.nextUrl.searchParams.get("locale") || "ru";
  const locale = isLocale(localeParam) ? localeParam : "ru";
  const ru = locale === "ru";

  const [forecasts, stats] = await Promise.all([
    prisma.forecast.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { event: { select: { slug: true, title: true, titleEn: true, imageUrl: true } } },
    }),
    getUserStats(user.id),
  ]);

  return NextResponse.json({
    forecasts: forecasts.map((f) => ({
      id: f.id,
      eventSlug: f.event.slug,
      eventTitle: ru ? f.event.title : f.event.titleEn ?? f.event.title,
      eventImage: f.event.imageUrl,
      targetDate: f.targetDate,
      status: f.status,
      direction: f.direction,
      confidence: f.confidence,
      isCorrect: f.isCorrect,
      createdAt: f.createdAt,
    })),
    stats,
  });
}
