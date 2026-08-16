import { prisma } from "./prisma";
import type { Locale } from "./i18n";
import type { EventCategory } from "@prisma/client";

export type EventView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: EventCategory;
  imageUrl: string | null;
  price: number;
  currency: string;
  currentPrice: number | null;
  chartData: unknown;
  status: string;
  closesAt: Date | null;
};

/** Lazy auto-close: events whose closesAt passed become CLOSED. */
export async function autoCloseEvents(): Promise<void> {
  const now = new Date();
  await prisma.event.updateMany({
    where: { status: "ACTIVE", closesAt: { lte: now } },
    data: { status: "CLOSED" },
  });
}

function toView(
  e: {
    id: string;
    slug: string;
    title: string;
    titleEn: string | null;
    description: string;
    descriptionEn: string | null;
    category: EventCategory;
    imageUrl: string | null;
    price: { toString(): string };
    currency: string;
    currentPrice: { toString(): string } | null;
    chartData: unknown;
    status: string;
    closesAt: Date | null;
  },
  locale: Locale
): EventView {
  const ru = locale === "ru";
  return {
    id: e.id,
    slug: e.slug,
    title: ru ? e.title : e.titleEn ?? e.title,
    description: ru ? e.description : e.descriptionEn ?? e.description,
    category: e.category,
    imageUrl: e.imageUrl,
    price: Number(e.price.toString()),
    currency: e.currency,
    currentPrice: e.currentPrice ? Number(e.currentPrice.toString()) : null,
    chartData: e.chartData,
    status: e.status,
    closesAt: e.closesAt,
  };
}

export async function getEvents(locale: Locale): Promise<EventView[]> {
  await autoCloseEvents();
  const events = await prisma.event.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  return events.map((e) => toView(e, locale));
}

export async function getEventBySlug(slug: string, locale: Locale): Promise<EventView | null> {
  await autoCloseEvents();
  const e = await prisma.event.findUnique({ where: { slug } });
  return e ? toView(e, locale) : null;
}

export async function getUserStats(userId: string) {
  const all = await prisma.forecast.findMany({
    where: { userId },
    select: { status: true, isCorrect: true },
  });
  const total = all.length;
  const ready = all.filter((f) => f.status === "READY").length;
  const correct = all.filter((f) => f.isCorrect === true).length;
  const judged = all.filter((f) => f.isCorrect !== null).length;
  return {
    total,
    ready,
    correct,
    judged,
    accuracy: judged > 0 ? Math.round((correct / judged) * 100) : null,
  };
}

export async function getLeaderboard(limit = 50) {
  const forecasts = await prisma.forecast.findMany({
    where: { isCorrect: { not: null } },
    select: { userId: true, isCorrect: true, user: { select: { name: true } } },
  });
  const map = new Map<string, { name: string; correct: number; total: number }>();
  for (const f of forecasts) {
    const entry = map.get(f.userId) ?? { name: f.user.name, correct: 0, total: 0 };
    entry.total += 1;
    if (f.isCorrect) entry.correct += 1;
    map.set(f.userId, entry);
  }
  return [...map.values()]
    .filter((e) => e.total >= 3)
    .map((e) => ({ ...e, accuracy: Math.round((e.correct / e.total) * 100) }))
    .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)
    .slice(0, limit);
}
