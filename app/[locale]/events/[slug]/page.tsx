import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEventBySlug } from "@/lib/data";
import { resolveEventImage } from "@/lib/categories";
import PriceChart from "@/components/PriceChart";
import BuyForecastCard from "@/components/BuyForecastCard";
import FogImage from "@/components/FogImage";

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
  const photo = resolveEventImage(event.imageUrl, event.category);

  return (
    <div className="fade-in space-y-6">
      <Link href={`/${locale}`} className="text-sm text-white/50 transition-colors hover:text-accent">
        {dict.eventPage.back}
      </Link>

      <div className="neon-card relative overflow-hidden">
        <FogImage
          src={photo}
          fallback={event.imageUrl ?? undefined}
          className="absolute inset-0 h-full w-full object-cover blur-[2px] brightness-[0.45]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/40 to-night" />
        {event.status !== "ACTIVE" && (
          <span className="badge absolute right-4 top-4 z-10 bg-red-900/80 text-white">
            {dict.events.closed}
          </span>
        )}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <span className="badge border border-accent/30 bg-accent/15 text-accent-light">
              {dict.category[event.category] || event.category}
            </span>
            <h1 className="mt-2 text-3xl font-bold text-white drop-shadow">{event.title}</h1>
            {event.currentPrice !== null && (
              <p className="mt-1 text-white/70">
                {dict.events.current}:{" "}
                <span className="font-bold text-accent-light">
                  {event.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">{dict.events.from}</p>
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
