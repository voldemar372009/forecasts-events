import { notFound } from "next/navigation";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEventsByCategory } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import MarketsGrid from "@/components/MarketsGrid";
import type { EventCardData } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: { locale: string; category: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);

  const category = params.category.toUpperCase();
  if (!(CATEGORIES as readonly string[]).includes(category)) notFound();

  const events = await getEventsByCategory(category, locale);

  const cards: EventCardData[] = events.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category,
    categoryLabel: dict.category[e.category] || e.category,
    imageUrl: e.imageUrl ?? "",
    currentPrice: e.currentPrice,
    price: e.price,
    currency: e.currency,
    chartData: (Array.isArray(e.chartData) ? e.chartData : null) as { t: string; v: number }[] | null,
    closed: e.status !== "ACTIVE",
  }));

  return (
    <div className="fade-in space-y-10">
      <section>
        <h1 className="text-3xl font-bold text-white">
          {dict.category[category as keyof typeof dict.category] ?? category}
        </h1>
        <p className="mt-2 text-white/60">{dict.events.subtitle}</p>
      </section>

      <MarketsGrid
        locale={locale}
        events={cards}
        categoryLabels={dict.category}
        cardLabels={{
          from: dict.events.from,
          current: dict.events.current,
          open: dict.events.open,
          closed: dict.events.closed,
        }}
        dict={{
          search: dict.events.search,
          filters: dict.events.filters,
          all: dict.events.all,
          live: dict.events.live,
        }}
      />
    </div>
  );
}