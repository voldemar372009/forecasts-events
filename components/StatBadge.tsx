export default function StatBadge({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="neon-card flex flex-col items-center gap-1 px-4 py-5">
      <span
        className={`text-3xl font-bold ${accent ? "text-accent" : "text-primary-light"}`}
      >
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
      </span>
    </div>
  );
}
