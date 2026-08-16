import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getLeaderboard } from "@/lib/data";
import LeaderboardTable from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const rows = await getLeaderboard();

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{dict.leaderboard.title}</h1>
        <p className="mt-1 text-white/60">{dict.leaderboard.subtitle}</p>
      </div>
      <LeaderboardTable rows={rows} dict={dict.leaderboard} />
    </div>
  );
}
