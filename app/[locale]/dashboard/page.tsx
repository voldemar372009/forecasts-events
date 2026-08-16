import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getUserStats } from "@/lib/data";
import StatBadge from "@/components/StatBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/dashboard`);

  const ru = locale === "ru";
  const [forecasts, stats] = await Promise.all([
    prisma.forecast.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { event: { select: { slug: true, title: true, titleEn: true } } },
    }),
    getUserStats(user.id),
  ]);

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{dict.dashboard.title}</h1>
        <p className="mt-1 text-white/60">{dict.dashboard.welcome.replace("{name}", user.name)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBadge label={dict.dashboard.stats.total} value={String(stats.total)} />
        <StatBadge label={dict.dashboard.stats.ready} value={String(stats.ready)} />
        <StatBadge label={dict.dashboard.stats.correct} value={String(stats.correct)} />
        <StatBadge label={dict.dashboard.stats.accuracy} value={stats.accuracy !== null ? `${stats.accuracy}%` : "—"} accent />
      </div>

      {forecasts.length === 0 ? (
        <div className="neon-card p-10 text-center">
          <p className="mb-4 text-white/60">{dict.dashboard.empty}</p>
          <Link href={`/${locale}`} className="btn-primary">
            {dict.dashboard.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="neon-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-night-line text-xs uppercase tracking-wide text-white/50">
                <th className="px-4 py-3">{dict.dashboard.cols.event}</th>
                <th className="px-4 py-3">{dict.dashboard.cols.target}</th>
                <th className="px-4 py-3">{dict.dashboard.cols.dir}</th>
                <th className="px-4 py-3">{dict.dashboard.cols.conf}</th>
                <th className="px-4 py-3">{dict.dashboard.cols.status}</th>
                <th className="px-4 py-3">{dict.dashboard.cols.result}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f) => {
                const title = ru ? f.event.title : f.event.titleEn ?? f.event.title;
                return (
                  <tr key={f.id} className="border-b border-night-line/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{title}</td>
                    <td className="px-4 py-3 text-white/70">
                      {new Date(f.targetDate).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
                    </td>
                    <td className="px-4 py-3">
                      {f.direction ? (
                        <span className="badge bg-night-light text-white/80">
                          {dict.forecast.dir[f.direction as "UP" | "DOWN" | "SIDE"] || f.direction}
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {f.confidence !== null ? `${f.confidence}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          f.status === "READY"
                            ? "bg-emerald-900/70 text-emerald-200"
                            : f.status === "FAILED"
                            ? "bg-red-900/70 text-red-200"
                            : "bg-night-light text-accent-light"
                        }`}
                      >
                        {dict.forecast.status[f.status as "PENDING" | "READY" | "FAILED"] || f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.isCorrect === null || f.isCorrect === undefined ? (
                        <span className="text-white/40">—</span>
                      ) : f.isCorrect ? (
                        <span className="font-semibold text-emerald-300">✓ {dict.dashboard.correct}</span>
                      ) : (
                        <span className="font-semibold text-red-300">✗ {dict.dashboard.wrong}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${locale}/forecast/${f.id}`}
                        className="text-sm font-medium text-primary-light hover:text-accent"
                      >
                        {dict.dashboard.view} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
