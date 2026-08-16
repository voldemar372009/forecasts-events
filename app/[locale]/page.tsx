import Link from "next/link";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getEvents } from "@/lib/data";
import EventCard from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const events = await getEvents(locale);

  const steps = [
    { t: dict.how.s1t, d: dict.how.s1d, icon: "📊" },
    { t: dict.how.s2t, d: dict.how.s2d, icon: "📅" },
    { t: dict.how.s3t, d: dict.how.s3d, icon: "🤖" },
  ];

  return (
    <div className="fade-in space-y-20">
      {/* Hero */}
      <section className="relative pb-6 pt-12 text-center">
        <div className="bg-heroGlow pointer-events-none absolute inset-0 -z-10" />
        <span className="badge mb-6 bg-primary/30 text-primary-light">{dict.hero.badge}</span>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          {dict.hero.titleA} <span className="neon-text">{dict.hero.titleB}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">{dict.hero.subtitle}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a href="#events" className="btn-primary">
            {dict.hero.cta}
          </a>
          <Link href={`/${locale}/new-forecast`} className="btn-ghost">
            {dict.hero.newForecast}
          </Link>
        </div>
        <a href="#how" className="mt-6 inline-block text-sm text-white/40 underline-offset-4 hover:text-accent hover:underline">
          {dict.hero.how} ↓
        </a>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24">
        <h2 className="mb-10 text-center text-3xl font-bold text-white">{dict.how.title}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="neon-card neon-card-hover p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-night-light text-2xl shadow-neumorphicSm">
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

      {/* Events */}
      <section id="events" className="scroll-mt-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">{dict.events.title}</h2>
          <p className="mt-2 text-white/60">{dict.events.subtitle}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              locale={locale}
              event={{
                slug: e.slug,
                title: e.title,
                category: e.category,
                categoryLabel: dict.category[e.category] || e.category,
                imageUrl: e.imageUrl ?? "",
                currentPrice: e.currentPrice,
                price: e.price,
                currency: e.currency,
                chartData: (Array.isArray(e.chartData) ? e.chartData : null) as {
                  t: string;
                  v: number;
                }[] | null,
                closed: e.status !== "ACTIVE",
              }}
              labels={{
                from: dict.events.from,
                current: dict.events.current,
                open: dict.events.open,
                closed: dict.events.closed,
              }}
            />
          ))}
        </div>
      </section>

      <p className="pb-4 text-center text-xs text-white/40">{dict.hero.disclaimer}</p>
    </div>
  );
}
