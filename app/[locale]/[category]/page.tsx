import { notFound } from "next/navigation";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEventsByCategory, getEventBySlug } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import MarketsGrid from "@/components/MarketsGrid";
import CurrencyRates from "@/components/CurrencyRates";
import StockIndexDynamics from "@/components/StockIndexDynamics";
import PoliticsGeopolitics from "@/components/PoliticsGeopolitics";
import SportsMain from "@/components/SportsMain";
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

  const toCard = (e: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>): EventCardData => ({
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
  });

  // Три окошка «Динамики фондовых индексов» — акции, мировые и российские биржи.
  const indexSlugs = ["stock-dynamics", "world-exchanges", "russian-exchanges"];
  const indexEvents = (
    await Promise.all(indexSlugs.map((slug) => getEventBySlug(slug, locale)))
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  const indexCards: EventCardData[] = indexEvents.map(toCard);

  // Три окошка «Политики и геополитики» — президентские, парламентские выборы, праймериз.
  const politicsSlugs = ["presidential-elections", "parliamentary-elections", "primaries"];
  const politicsEvents = (
    await Promise.all(politicsSlugs.map((slug) => getEventBySlug(slug, locale)))
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  const politicsCards: EventCardData[] = politicsEvents.map(toCard);

  // Окна «Спорта»: топ-турниры, популярные лиги, киберспорт, индивидуальные достижения.
  const sportsGroups: Record<"top" | "leagues" | "esports" | "achievements", EventCardData[]> = {
    top: [],
    leagues: [],
    esports: [],
    achievements: [],
  };
  const sportsSlugs: Record<keyof typeof sportsGroups, string[]> = {
    top: ["world-cup", "olympic-games", "super-bowl"],
    leagues: ["nba", "premier-league", "nfl", "euro-cups"],
    esports: ["dota-2", "league-of-legends", "cs2"],
    achievements: ["sports-records", "player-transfers", "mvp-awards"],
  };
  for (const [group, slugs] of Object.entries(sportsSlugs) as [keyof typeof sportsGroups, string[]][]) {
    const found = (
      await Promise.all(slugs.map((slug) => getEventBySlug(slug, locale)))
    ).filter((e): e is NonNullable<typeof e> => e !== null);
    sportsGroups[group] = found.map(toCard);
  }

  // События, показанные в главных окнах выше, убираем из нижнего списка «Все рынки»,
  // чтобы не дублировались одни и те же окошки на странице.
  const hiddenInMainWindows =
    category === "ECONOMICS"
      ? [...indexSlugs]
      : category === "POLITICS"
        ? [...politicsSlugs]
        : category === "SPORTS"
          ? [
              ...sportsSlugs.top,
              ...sportsSlugs.leagues,
              ...sportsSlugs.esports,
              ...sportsSlugs.achievements,
            ]
          : [];

  const cards: EventCardData[] = events
    .map(toCard)
    .filter((e) => !hiddenInMainWindows.includes(e.slug));

  const cardLabels = {
    from: dict.events.from,
    current: dict.events.current,
    open: dict.events.open,
    closed: dict.events.closed,
  };

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
            cardLabels={cardLabels}
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

      {category === "POLITICS" && (
        <>
          {/* Главное окошко «Политика и геополитика» с тремя окошками внутри */}
          <PoliticsGeopolitics
            locale={locale}
            dict={{
              title: dict.politics.title,
              subtitle: dict.politics.subtitle,
            }}
            cards={politicsCards}
            cardLabels={cardLabels}
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

      {category === "SPORTS" && (
        <>
          {/* Главное окошко «Спорт» с окнами внутри:
              Чемпионат мира по футболу, Олимпийские игры, Супербоул,
              Популярные лиги (НБА, АПЛ, НФЛ, Еврокубки),
              Киберспорт (Dota 2, League of Legends, CS2),
              Индивидуальные достижения (рекорды, переходы игроков, награды MVP) */}
          <SportsMain
            locale={locale}
            dict={{
              title: dict.sports.title,
              subtitle: dict.sports.subtitle,
              popularLeagues: dict.sports.popularLeagues,
              popularLeaguesSubtitle: dict.sports.popularLeaguesSubtitle,
              esports: dict.sports.esports,
              esportsSubtitle: dict.sports.esportsSubtitle,
              achievements: dict.sports.achievements,
              achievementsSubtitle: dict.sports.achievementsSubtitle,
            }}
            groups={sportsGroups}
            cardLabels={cardLabels}
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

      {category !== "POLITICS" && (
        <section>
          <MarketsGrid
            locale={locale}
            events={cards}
            categoryLabels={dict.category}
            cardLabels={cardLabels}
            dict={{
              search: dict.events.search,
              filters: dict.events.filters,
              all: dict.events.all,
              live: dict.events.live,
            }}
          />
        </section>
      )}

      {category === "CLIMATE" && (
        <section>
          {/* Своё окно прогноза — точная копия с главной страницы */}
          <div id="custom-forecast" className="scroll-mt-24 mt-10">
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
        </section>
      )}
    </div>
  );
}