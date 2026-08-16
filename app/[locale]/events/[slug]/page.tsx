import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEventBySlug } from "@/lib/data";
import PriceChart from "@/components/PriceChart";
import BuyForecastCard from "@/components/BuyForecastCard";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const event = await getEventBySlug(params.slug, locale);
  if (!event) notFound();

  const chartData = (Array.isArray(event.chartData) ? event.chartData : null) as {
    t: string;
    v: number;
  }[] | null;

  return (
    <div className="fade-in space-y-6">
      <Link href={`/${locale}`} className="text-sm text-white/50 transition-colors hover:text-accent">
        {dict.eventPage.back}
      </Link>

      <div className="neon-card overflow-hidden">
        <div className="relative h-56 sm:h-64">
          <img src={event.imageUrl ?? ""} alt={event.title} className="h-full w-full object-cover" />
          <span className="badge absolute left-4 top-4 bg-night/80 text-accent-light backdrop-blur">
            {dict.category[event.category] || event.category}
          </span>
          {event.status !== "ACTIVE" && (
            <span className="badge absolute right-4 top-4 bg-red-900/80 text-white">
              {dict.events.closed}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            {event.currentPrice !== null && (
              <p className="mt-1 text-white/60">
                {dict.events.current}:{" "}
                <span className="font-bold text-primary-light">
                  {event.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">{dict.events.from}</p>
            <p className="text-2xl font-bold text-accent">
              {event.price} {event.currency}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="neon-card p-6">
            <h2 className="mb-3 font-semibold text-white">{dict.eventPage.chart}</h2>
            {chartData && chartData.length > 1 ? (
              <PriceChart data={chartData} />
            ) : (
              <div className="h-64 rounded-xl bg-night-light/50" />
            )}
          </div>
          <div className="neon-card p-6">
            <h2 className="mb-3 font-semibold text-white">{dict.eventPage.description}</h2>
            <p className="leading-relaxed text-white/80">{event.description}</p>
          </div>
        </div>
        <div>
          <BuyForecastCard
            eventSlug={event.slug}
            price={event.price}
            currency={event.currency}
            locale={locale}
            closed={event.status !== "ACTIVE"}
            dict={{
              chooseDate: dict.eventPage.chooseDate,
              dateHint: dict.eventPage.dateHint,
              priceLabel: dict.eventPage.priceLabel,
              buy: dict.eventPage.buy,
              buyPending: dict.eventPage.buyPending,
              dateRequired: dict.eventPage.dateRequired,
              closed: dict.eventPage.closed,
            }}
          />
          <p className="mt-4 text-xs leading-relaxed text-white/40">{dict.hero.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
