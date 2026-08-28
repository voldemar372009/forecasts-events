import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import ForecastView, { type ForecastViewData } from "@/components/ForecastView";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/forecast/${params.id}`);

  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { event: true },
  });
  if (!forecast) notFound();
  const isOwner = forecast.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const ru = locale === "ru";
  const initial: ForecastViewData = {
    id: forecast.id,
    status: forecast.status,
    direction: forecast.direction,
    confidence: forecast.confidence,
    summary: ru ? forecast.summary : forecast.summaryEn ?? forecast.summary,
    keyLevels: forecast.keyLevels as { support?: number[]; resistance?: number[] } | null,
    chartData: forecast.chartData as {
      series: { t: string; v: number }[];
      targetDate: string;
      targetValue: number;
    } | null,
    targetDate: forecast.targetDate.toISOString(),
    priceAtRequest: forecast.priceAtRequest ? Number(forecast.priceAtRequest.toString()) : null,
    errorMessage: forecast.errorMessage,
  };

  const eventTitle = ru ? forecast.event.title : forecast.event.titleEn ?? forecast.event.title;

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${locale}/dashboard`} className="text-sm text-white/50 hover:text-accent">
          ← {dict.dashboard.title}
        </Link>
        <Link
          href={`/${locale}/events/${forecast.event.slug}`}
          className="text-xl font-bold text-white transition-colors hover:text-accent"
        >
          {eventTitle}
        </Link>
      </div>
      <ForecastView
        initial={initial}
        locale={locale}
        dict={{
          status: dict.forecast.status,
          dir: dict.forecast.dir,
          confidence: dict.forecast.confidence,
          accuracy: dict.forecast.accuracy,
          support: dict.forecast.support,
          resistance: dict.forecast.resistance,
          target: dict.forecast.target,
          priceAt: dict.forecast.priceAt,
          chart: dict.forecast.chart,
          retry: dict.forecast.retry,
          retrying: dict.forecast.retrying,
          demo: dict.forecast.demo,
          error: dict.forecast.error,
        }}
      />
    </div>
  );
}
