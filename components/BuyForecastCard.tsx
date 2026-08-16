"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "./DatePicker";
import { todayInput, maxDateInput } from "@/lib/format";

type BuyDict = {
  chooseDate: string;
  dateHint: string;
  priceLabel: string;
  buy: string;
  buyPending: string;
  dateRequired: string;
  closed: string;
};

export default function BuyForecastCard({
  eventSlug,
  price,
  currency,
  locale,
  dict,
  closed,
}: {
  eventSlug: string;
  price: number;
  currency: string;
  locale: string;
  dict: BuyDict;
  closed: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!date) {
      setError(dict.dateRequired);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/forecasts/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventSlug, targetDate: date, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/${locale}/auth/login?next=/${locale}/events/${eventSlug}`);
        return;
      }
      if (!res.ok || !data.url) {
        setError(dict.dateRequired);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(dict.dateRequired);
      setLoading(false);
    }
  }

  return (
    <div className="neon-card p-6">
      <h2 className="mb-1 text-lg font-bold text-white">{dict.chooseDate}</h2>
      <p className="mb-4 text-sm text-white/50">{dict.dateHint}</p>
      {closed ? (
        <p className="rounded-xl bg-red-900/40 px-4 py-3 text-sm text-red-200">{dict.closed}</p>
      ) : (
        <>
          <DatePicker value={date} onChange={setDate} min={todayInput()} max={maxDateInput()} />
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">{dict.priceLabel}</p>
              <p className="text-2xl font-bold text-accent">
                {price} {currency}
              </p>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button className="btn-primary mt-5 w-full" onClick={buy} disabled={loading}>
            {loading ? dict.buyPending : dict.buy}
          </button>
        </>
      )}
    </div>
  );
}
