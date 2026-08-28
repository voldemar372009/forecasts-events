"use client";

import { useEffect, useState } from "react";
import ForecastChart from "./ForecastChart";

export type ForecastViewData = {
  id: string;
  status: "PENDING" | "READY" | "FAILED";
  direction: string | null;
  confidence: number | null;
  summary: string | null;
  keyLevels: { support?: number[]; resistance?: number[] } | null;
  chartData: { series: { t: string; v: number }[]; targetDate: string; targetValue: number } | null;
  targetDate: string;
  priceAtRequest: number | null;
  errorMessage: string | null;
};

type FDict = {
  status: Record<string, string>;
  dir: Record<string, string>;
  confidence: string;
  accuracy: string;
  support: string;
  resistance: string;
  target: string;
  priceAt: string;
  chart: string;
  retry: string;
  retrying: string;
  demo: string;
  error: string;
};

export default function ForecastView({
  initial,
  locale,
  dict,
}: {
  initial: ForecastViewData;
  locale: string;
  dict: FDict;
}) {
  const [data, setData] = useState<ForecastViewData>(initial);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (data.status !== "PENDING") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/forecasts/${data.id}?locale=${locale}`);
        const json = await res.json();
        if (json.forecast) setData(json.forecast);
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [data.status, data.id, locale]);

  async function retry() {
    setRetrying(true);
    try {
      await fetch(`/api/forecasts/${data.id}/retry`, { method: "POST" });
      setData({ ...data, status: "PENDING", errorMessage: null });
    } finally {
      setRetrying(false);
    }
  }

  const dirLabel = data.direction ? dict.dir[data.direction] || data.direction : "—";
  const isDemo = (data.summary || "").includes("ДЕМО");

  return (
    <div className="space-y-6">
      {data.status === "PENDING" && (
        <div className="neon-card flex flex-col items-center gap-3 p-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-accent" />
          <p className="text-white/70">{dict.status.PENDING}</p>
        </div>
      )}

      {data.status === "FAILED" && (
        <div className="neon-card p-8 text-center">
          <p className="mb-1 text-lg font-bold text-red-300">{dict.status.FAILED}</p>
          {data.errorMessage && (
            <p className="mb-4 text-sm break-all text-white/50">
              {dict.error.replace("{msg}", data.errorMessage)}
            </p>
          )}
          <button className="btn-primary" onClick={retry} disabled={retrying}>
            {retrying ? dict.retrying : dict.retry}
          </button>
        </div>
      )}

      {data.status === "READY" && data.summary && (
        <>
          {isDemo && (
            <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-light">
              {dict.demo}
            </div>
          )}
          <div className="neon-card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="badge bg-primary text-white">{dirLabel}</span>
              <span className="badge bg-night-light text-white/80">
                {dict.confidence}: {data.confidence ?? "—"}%
              </span>
              <span className="badge bg-night-light text-white/60">
                {dict.target}: {new Date(data.targetDate).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
              </span>
              {data.priceAtRequest !== null && (
                <span className="badge bg-night-light text-white/60">
                  {dict.priceAt}: {data.priceAtRequest}
                </span>
              )}
            </div>
            <p className="text-base leading-relaxed text-white/90">{data.summary}</p>
            {data.keyLevels && (
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-night-light/60 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-red-300">{dict.support}</p>
                  {(data.keyLevels.support || []).map((l, i) => (
                    <p key={i} className="font-mono text-sm text-white">
                      {l}
                    </p>
                  ))}
                </div>
                <div className="rounded-xl bg-night-light/60 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-emerald-300">{dict.resistance}</p>
                  {(data.keyLevels.resistance || []).map((l, i) => (
                    <p key={i} className="font-mono text-sm text-white">
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {data.chartData && (
            <div className="neon-card p-6">
              <h3 className="mb-3 font-semibold text-white">{dict.chart}</h3>
              <ForecastChart
                series={data.chartData.series}
                targetDate={data.chartData.targetDate}
                targetValue={data.chartData.targetValue}
              />
              <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
                <span className="text-sm font-medium text-white/70">{dict.accuracy}:</span>
                <span className="text-3xl font-bold text-accent">{data.confidence ?? "—"}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
