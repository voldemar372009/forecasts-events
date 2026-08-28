import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEvents } from "@/lib/data";
import MarketsGrid from "@/components/MarketsGrid";
import CustomForecastWindow from "@/components/CustomForecastWindow";
import type { EventCardData } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const events = await getEvents(locale);

  const cards: EventCardData[] = events
    .slice(0, 9)
    .map((e) => ({
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

  const steps = [
    { t: dict.how.s1t, d: dict.how.s1d, icon: "📊" },
    { t: dict.how.s2t, d: dict.how.s2d, icon: "📅" },
    { t: dict.how.s3t, d: dict.how.s3d, icon: "🤖" },
  ];

  return (
    <div className="fade-in space-y-12">
      {/* Шапка страницы */}
      <section className="relative pt-6 pb-2">
        <div className="bg-heroGlow pointer-events-none absolute inset-0 -z-10" />
        <span className="badge mb-4 border border-accent/30 bg-accent/10 text-accent-light">
          {dict.hero.badge}
        </span>
        <h1 className="text-3xl font-bold sm:text-5xl">
          {dict.events.title}{" "}
          <span className="neon-text">{dict.hero.titleB}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">{dict.events.subtitle}</p>
      </section>

      {/* Как это работает */}
      <section id="how" className="scroll-mt-24">
        <h2 className="mb-8 text-center text-2xl font-bold text-white">{dict.how.title}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="neon-card neon-card-hover p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-night-light text-xl shadow-neumorphicSm">
                {s.icon}
              </div>
              <h3 className="mb-2 font-semibold text-white">
                <span className="mr-1 text-accent">{i + 1}.</span> {s.t}
              </h3>
              <p className="text-sm text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Рынки */}
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

      {/* Своё окно прогноза: посетитель отправляет свой запрос */}
      <section id="custom-forecast" className="scroll-mt-24">
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
      </section>

    </div>
  );
}
