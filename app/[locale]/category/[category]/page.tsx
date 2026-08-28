import { notFound } from "next/navigation";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEventsByCategory, getEventBySlug } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import MarketsGrid from "@/components/MarketsGrid";
import CurrencyRates from "@/components/CurrencyRates";
import StockIndexDynamics from "@/components/StockIndexDynamics";
import CustomForecastWindow from "@/components/CustomForecastWindow";
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

  // Три окошка «Динамики фондовых индексов» — акции, мировые и российские биржи.
  const indexSlugs = ["stock-dynamics", "world-exchanges", "russian-exchanges"];
  const indexEvents = (
    await Promise.all(indexSlugs.map((slug) => getEventBySlug(slug, locale)))
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  const indexCards: EventCardData[] = indexEvents.map((e) => ({
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

      {category === "ECONOMICS" && (
        <>
          <CurrencyRates
            locale={locale}
            dict={{
              title: dict.currency.title,
              subtitle: dict.currency.subtitle,
              search: dict.currency.search,
              filters: dict.currency.filters,
              all: dict.currency.all,
              groups: dict.currency.groups,
              featured: dict.currency.featured,
              loading: dict.currency.loading,
              error: dict.currency.error,
              empty: dict.currency.empty,
              refresh: dict.currency.refresh,
              change: dict.currency.change,
              from: dict.events.from,
              current: dict.events.current,
              open: dict.events.open,
            }}
          />

          <StockIndexDynamics
            locale={locale}
            dict={{
              title: dict.indices.title,
              subtitle: dict.indices.subtitle,
            }}
            cards={indexCards}
            cardLabels={{
              from: dict.events.from,
              current: dict.events.current,
              open: dict.events.open,
              closed: dict.events.closed,
            }}
          />

          {/* Своё окно прогноза — точная копия с главной страницы */}
          <div id="custom-forecast" className="scroll-mt-24">
            <CustomForecastWindow
              locale={locale}
              dict={{
                title: dict.customForecast.title,
                subtitle: dict.customForecast.subtitle,
                subtitle2: dict.customForecast.subtitle2,
                queryLabel: dict.customForecast.queryLabel,
                queryPlaceholder: dict.customForecast.queryPlaceholder,
                queryExample: dict.customForecast.queryExample,
                chooseDate: dict.customForecast.chooseDate,
                dateHint: dict.customForecast.dateHint,
                currentPrice: dict.customForecast.currentPrice,
                autoSource: dict.customForecast.autoSource,
                analysis: dict.customForecast.analysis,
                loading: dict.customForecast.loading,
                noData: dict.customForecast.noData,
                generate: dict.customForecast.generate,
                generating: dict.customForecast.generating,
                nameRequired: dict.customForecast.nameRequired,
                dateRequired: dict.customForecast.dateRequired,
                error: dict.customForecast.error,
                priceLabel: dict.customForecast.priceLabel,
                note: dict.customForecast.note,
                support: dict.customForecast.support,
                resistance: dict.customForecast.resistance,
                change30d: dict.customForecast.change30d,
                rsi: dict.customForecast.rsi,
              }}
            />
          </div>
        </>
      )}

      <section>
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
      </section>
    </div>
  );
}