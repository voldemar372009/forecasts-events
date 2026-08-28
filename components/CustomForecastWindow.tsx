"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "./DatePicker";
import PriceChart from "./PriceChart";
import { todayInput, maxDateInput } from "@/lib/format";

type Quote = {
  price?: number;
  currency?: string;
  source?: string;
  symbol?: string;
  history?: { t: string; v: number }[] | null;
  analysis?: {
    direction?: string;
    confidence?: number;
    trend?: number;
    rsi?: number;
    support?: number[];
    resistance?: number[];
    change30d?: number;
    summaryRu?: string;
    summaryEn?: string;
  } | null;
};

type Dict = {
  title: string;
  subtitle: string;
  subtitle2: string;
  queryLabel: string;
  queryPlaceholder: string;
  queryExample: string;
  chooseDate: string;
  dateHint: string;
  currentPrice: string;
  autoSource: string;
  analysis: string;
  loading: string;
  noData: string;
  generate: string;
  generating: string;
  nameRequired: string;
  dateRequired: string;
  error: string;
  priceLabel: string;
  note: string;
  support: string;
  resistance: string;
  change30d: string;
  rsi: string;
};

export default function CustomForecastWindow({
  locale,
  dict,
}: {
  locale: string;
  dict: Dict;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setQuote(null);
      setAnalyzing(false);
      return;
    }
    setAnalyzing(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/quote?title=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.quote?.price) setQuote(data.quote);
        else setQuote(null);
      } catch {
        setQuote(null);
      } finally {
        setAnalyzing(false);
      }
    }, 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const analysis = quote?.analysis;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError(dict.nameRequired);
      return;
    }
    if (!date) {
      setError(dict.dateRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const price = quote?.price ?? 0;
      const res = await fetch("/api/forecasts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom: true,
          title: query.trim(),
          category: "OTHER",
          currentPrice: price,
          targetDate: date,
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/${locale}/auth/login?next=/${locale}`);
        return;
      }
      if (!res.ok || !data.url) {
        setError(dict.error);
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(dict.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={submit} className="neon-card p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white">{dict.title}</h2>
          <p className="mt-1 text-sm text-white/60">{dict.subtitle}</p>
          <p className="mt-1 text-xs text-white/40">{dict.subtitle2}</p>
        </div>

        <div className="mb-5">
          <label className="label-form" htmlFor="cq-text">
            {dict.queryLabel}
          </label>
          <textarea
            id="cq-text"
            className="input-neon min-h-[96px] resize-y"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.queryPlaceholder}
            maxLength={200}
            required
          />
          <p className="mt-1 text-xs text-accent/70">💡 {dict.queryExample}</p>
        </div>

        {query.trim().length >= 2 && (
          <div className="mb-5">
            {analyzing && !quote && (
              <p className="text-sm text-white/40">{dict.loading}</p>
            )}
            {!analyzing && !quote && (
              <p className="text-sm text-white/40">{dict.noData}</p>
            )}
            {quote?.price && (
              <div className="rounded-xl border border-night-line bg-night-light/40 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-white/70">
                    {dict.currentPrice}:{" "}
                    <span className="font-bold text-accent">
                      {quote.price} {quote.currency}
                    </span>
                  </p>
                  {quote.source && (
                    <span className="text-xs text-emerald-300">
                      ✓ {dict.autoSource.replace("{src}", `${quote.source} · ${quote.symbol}`)}
                    </span>
                  )}
                </div>

                {quote.history && quote.history.length > 1 && (
                  <PriceChart data={quote.history} />
                )}

                {analysis && (
                  <div className="mt-4 rounded-xl bg-night-card/80 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                      {dict.analysis}
                    </p>
                    <p className="text-sm leading-relaxed text-white/85">
                      {locale === "ru" ? analysis.summaryRu : analysis.summaryEn}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      {(analysis.support || []).length > 0 && (
                        <div>
                          <p className="mb-1 text-red-300">{dict.support}</p>
                          {analysis.support!.map((s, i) => (
                            <p key={i} className="font-mono text-white">{s}</p>
                          ))}
                        </div>
                      )}
                      {(analysis.resistance || []).length > 0 && (
                        <div>
                          <p className="mb-1 text-emerald-300">{dict.resistance}</p>
                          {analysis.resistance!.map((r, i) => (
                            <p key={i} className="font-mono text-white">{r}</p>
                          ))}
                        </div>
                      )}
                      {analysis.change30d !== undefined && (
                        <div>
                          <p className="mb-1 text-white/50">{dict.change30d}</p>
                          <p className="font-mono text-white">
                            {analysis.change30d >= 0 ? "+" : ""}
                            {analysis.change30d}%
                          </p>
                        </div>
                      )}
                      {analysis.rsi !== undefined && (
                        <div>
                          <p className="mb-1 text-white/50">{dict.rsi}</p>
                          <p className="font-mono text-white">{analysis.rsi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="label-form">{dict.chooseDate}</label>
          <DatePicker value={date} onChange={setDate} min={todayInput()} max={maxDateInput()} />
          <p className="mt-1 text-xs text-white/40">{dict.dateHint}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/50">{dict.priceLabel}</p>
            <p className="text-2xl font-bold text-accent">10$ / 10€ / 10USDT</p>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? dict.generating : dict.generate}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <p className="mt-4 text-xs text-white/40">{dict.note}</p>
      </form>
    </div>
  );
}
