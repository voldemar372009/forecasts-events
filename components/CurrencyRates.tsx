"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

type PairRate = {
  pair: string;
  slug: string;
  labelRu: string;
  labelEn: string;
  groups: string[];
  feat?: "rub" | "usd" | "eur";
  price: number | null;
  currency: string;
  changePct: number | null;
  history: { t: string; v: number }[] | null;
  photo: string;
};

type Dict = {
  title: string;
  subtitle: string;
  search: string;
  filters: string;
  all: string;
  groups: { rub: string; usd: string; eur: string; other: string };
  featured: { rub: string; usd: string; eur: string };
  loading: string;
  error: string;
  empty: string;
  refresh: string;
  change: string;
  from: string;
  current: string;
  open: string;
};

const GROUP_KEYS = ["rub", "usd", "eur", "other"] as const;

export default function CurrencyRates({ locale, dict }: { locale: string; dict: Dict }) {
  const [rates, setRates] = useState<PairRate[] | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market/rates");
      const data = await res.json();
      if (data.rates) {
        setRates(data.rates);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isRu = locale === "ru";
  const labelOf = (p: PairRate) => (isRu ? p.labelRu : p.labelEn);

  const featured: PairRate[] =
    rates?.filter((p) => p.feat) ?? (["rub", "usd", "eur"] as const).map(() => null as unknown as PairRate);

  const filtered = (rates ?? [])
    .filter((p) => !p.feat)
    .filter((p) => {
      const byQ =
        !q.trim() ||
        p.pair.toLowerCase().includes(q.trim().toLowerCase()) ||
        labelOf(p).toLowerCase().includes(q.trim().toLowerCase());
      const byG = !group || p.groups.includes(group);
      return byQ && byG;
    });

  const groupLabels: Record<string, string> = {
    rub: dict.groups.rub,
    usd: dict.groups.usd,
    eur: dict.groups.eur,
    other: dict.groups.other,
  };

  function RateCard({ p, big }: { p: PairRate; big?: boolean }) {
    const gid = p.pair.replace("/", "-");
    const change = p.changePct;
    const spark = p.history && p.history.length > 1 ? p.history : null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3 }}
        className="neon-card neon-card-hover relative overflow-hidden group"
      >
        {/* Размытое фото-фон по названию пары */}
        <img
          src={p.photo}
          alt=""
          aria-hidden
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.style.opacity = "0";
          }}
          className="absolute inset-0 h-full w-full object-cover blur-[3px] brightness-[0.5] saturate-[0.75] transition-transform duration-700 group-hover:scale-110"
        />
        {/* Дымка для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-b from-night/80 via-night/50 to-night" />

        <Link
          href={`/${locale}/events/${p.slug}`}
          className="relative z-10 flex min-h-[290px] flex-col p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="badge border border-accent/30 bg-accent/15 text-accent-light backdrop-blur">
              {p.pair}
            </span>
            {change !== null && (
              <span
                className={`badge ${
                  change >= 0 ? "bg-emerald-900/70 text-emerald-200" : "bg-red-900/70 text-red-200"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </div>

          <h3 className={`mt-3 font-bold text-white drop-shadow ${big ? "text-lg" : "text-sm"}`}>
            {labelOf(p)}
          </h3>

          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs text-white/60">{dict.current}</p>
                {p.price !== null ? (
                  <p className={`font-bold text-accent-light ${big ? "text-3xl" : "text-2xl"}`}>
                    {p.price.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                  </p>
                ) : (
                  <p className={`font-bold text-white/40 ${big ? "text-3xl" : "text-2xl"}`}>—</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">{dict.from}</p>
                <p className="text-lg font-bold text-white">10$ / 10€ / 10USDT</p>
              </div>
            </div>

            {spark ? (
              <div
                className="mt-3 w-full"
                style={{ height: big ? 72 : 56, filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`fx-${gid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill={`url(#fx-${gid})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-night-light/50" style={{ height: big ? 72 : 56 }} />
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-accent-light transition-colors group-hover:text-accent-light">
                {dict.open} →
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <section className="neon-card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{dict.title}</h2>
        <p className="mt-1 text-sm text-white/60">{dict.subtitle}</p>
      </div>

      {/* Панель инструментов — как на главной */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="input-neon sm:max-w-sm"
          placeholder={dict.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <button className="btn-ghost !py-2 text-sm" onClick={() => setShowFilters((v) => !v)}>
            {dict.filters}
          </button>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Live</span>
          </span>
        </div>
      </div>

      {/* Чипы групп валют */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`badge cursor-pointer border transition-colors ${
              !group ? "border-accent/60 bg-accent/20 text-accent-light" : "border-night-line bg-night-card text-white/60 hover:text-white"
            }`}
            onClick={() => setGroup(null)}
          >
            {dict.all}
          </button>
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              className={`badge cursor-pointer border transition-colors ${
                group === g ? "border-accent/60 bg-accent/20 text-accent-light" : "border-night-line bg-night-card text-white/60 hover:text-white"
              }`}
              onClick={() => setGroup(group === g ? null : g)}
            >
              {groupLabels[g]}
            </button>
          ))}
        </div>
      )}

      {rates === null && !error && (
        <p className="mt-8 text-center text-white/40">{dict.loading}</p>
      )}

      {error && (
        <div className="mt-8 text-center">
          <p className="text-white/40">{dict.error}</p>
          <button className="btn-ghost mt-4 !py-2 text-sm" onClick={() => void load()}>
            {dict.refresh}
          </button>
        </div>
      )}

      {rates !== null && !error && (
        <>
          {/* Три главных окошка: рубль, доллар, евро */}
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((p, i) => {
              return p ? (
                <div key={p.pair}>
                  <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-white/50">
                    {p.feat ? (p.feat === "rub" ? dict.featured.rub : p.feat === "usd" ? dict.featured.usd : dict.featured.eur) : ""}
                  </p>
                  <RateCard p={p} big />
                </div>
              ) : (
                <div key={i} className="rounded-2xl bg-night-light/30 p-4">
                  <div className="h-32 animate-pulse rounded-lg bg-night-light/50" />
                </div>
              );
            })}
          </div>

          {/* Остальные основные пары */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <RateCard key={p.pair} p={p} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="mt-8 text-center text-white/40">{dict.empty}</p>
          )}
        </>
      )}
    </section>
  );
}
