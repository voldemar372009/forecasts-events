export type LeaderboardRow = {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
};

type LDict = {
  title: string;
  subtitle: string;
  cols: { place: string; user: string; correct: string; total: string; accuracy: string };
  empty: string;
};

export default function LeaderboardTable({
  rows,
  dict,
}: {
  rows: LeaderboardRow[];
  dict: LDict;
}) {
  if (rows.length === 0) {
    return <p className="text-white/50">{dict.empty}</p>;
  }
  return (
    <div className="neon-card overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-night-line text-xs font-semibold uppercase tracking-wide text-white/50">
            <th className="px-5 py-3">{dict.cols.place}</th>
            <th className="px-5 py-3">{dict.cols.user}</th>
            <th className="px-5 py-3 text-right">{dict.cols.correct}</th>
            <th className="px-5 py-3 text-right">{dict.cols.total}</th>
            <th className="px-5 py-3 text-right">{dict.cols.accuracy}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const medal =
              i === 0 ? "text-accent" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/60";
            return (
              <tr key={`${row.name}-${i}`} className="border-b border-night-line/50 last:border-0">
                <td className={`px-5 py-3 font-bold ${medal}`}>{i + 1}</td>
                <td className="px-5 py-3 font-medium text-white">{row.name}</td>
                <td className="px-5 py-3 text-right text-emerald-300">{row.correct}</td>
                <td className="px-5 py-3 text-right text-white/70">{row.total}</td>
                <td className="px-5 py-3 text-right">
                  <span className="badge bg-primary text-white">{row.accuracy}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
