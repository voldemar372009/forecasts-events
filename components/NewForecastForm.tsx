"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "./DatePicker";
import { todayInput, maxDateInput } from "@/lib/format";
import { detectCategory, type CategoryId } from "@/lib/categories";

type NewDict = {
  marketName: string;
  marketNamePlaceholder: string;
  category: string;
  currentPrice: string;
  currentPriceHint: string;
  chooseDate: string;
  dateHint: string;
  priceLabel: string;
  buy: string;
  buyPending: string;
  nameRequired: string;
  priceInvalid: string;
  dateRequired: string;
  note: string;
  autoCategory: string;
};

export default function NewForecastForm({
  locale,
  categories,
  categoryLabels,
  dict,
  price,
  currency,
}: {
  locale: string;
  categories: string[];
  categoryLabels: Record<string, string>;
  dict: NewDict;
  price: number;
  currency: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "OTHER");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [autoDetected, setAutoDetected] = useState<CategoryId | null>(null);
  const [currentPrice, setCurrentPrice] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTitleChange(v: string) {
    setTitle(v);
    const detected = detectCategory(v);
    if (detected) {
      setCategory(detected);
      setAutoDetected(detected);
    } else {
      setAutoDetected(null);
      if (!categoryTouched) setCategory(categories[0] ?? "OTHER");
    }
  }

  function onCategoryChange(v: string) {
    setCategory(v);
    setCategoryTouched(true);
    setAutoDetected(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError(dict.nameRequired);
      return;
    }
    const priceVal = Number(currentPrice);
    if (!(priceVal > 0) || !isFinite(priceVal)) {
      setError(dict.priceInvalid);
      return;
    }
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
        body: JSON.stringify({
          custom: true,
          title: title.trim(),
          category,
          currentPrice: priceVal,
          targetDate: date,
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(`/${locale}/auth/login?next=/${locale}/new-forecast`);
        return;
      }
      if (!res.ok || !data.url) {
        setError(dict.priceInvalid);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(dict.priceInvalid);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="neon-card mx-auto w-full max-w-2xl p-8">
      <div className="mb-6 grid gap-5">
        <div>
          <label className="label-form" htmlFor="nf-title">
            {dict.marketName}
          </label>
          <input
            id="nf-title"
            className="input-neon"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={dict.marketNamePlaceholder}
            maxLength={80}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label-form" htmlFor="nf-category">
              {dict.category}
            </label>
            <select
              id="nf-category"
              className="input-neon"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c] || c}
                </option>
              ))}
            </select>
            {autoDetected && (
              <p className="mt-1 text-xs text-accent-light">✓ {dict.autoCategory}</p>
            )}
          </div>
          <div>
            <label className="label-form" htmlFor="nf-price">
              {dict.currentPrice}
            </label>
            <input
              id="nf-price"
              type="number"
              step="any"
              min="0.01"
              className="input-neon"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-white/40">{dict.currentPriceHint}</p>
          </div>
        </div>

        <div>
          <label className="label-form">{dict.chooseDate}</label>
          <DatePicker value={date} onChange={setDate} min={todayInput()} max={maxDateInput()} />
          <p className="mt-1 text-xs text-white/40">{dict.dateHint}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/50">{dict.priceLabel}</p>
          <p className="text-2xl font-bold text-accent">
            {price} {currency}
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? dict.buyPending : dict.buy}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <p className="mt-4 text-xs text-white/40">{dict.note}</p>
    </form>
  );
}
