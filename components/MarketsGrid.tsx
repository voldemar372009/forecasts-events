"use client";

import { useMemo, useState } from "react";
import EventCard, { type EventCardData } from "./EventCard";

type ToolbarDict = {
  search: string;
  filters: string;
  all: string;
  live: string;
};

export default function MarketsGrid({
  locale,
  events,
  categoryLabels,
  cardLabels,
  dict,
}: {
  locale: string;
  events: EventCardData[];
  categoryLabels: Record<string, string>;
  cardLabels: { from: string; current: string; open: string; closed: string };
  dict: ToolbarDict;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))], [events]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return events.filter((e) => {
      const byQuery =
        !query ||
        e.title.toLowerCase().includes(query) ||
        e.categoryLabel.toLowerCase().includes(query);
      const byCat = !cat || e.category === cat;
      return byQuery && byCat;
    });
  }, [events, q, cat]);

  return (
    <div>
      {/* Панель инструментов: поиск + фильтры + Live */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">{dict.live}</span>
          </span>
        </div>
      </div>

      {/* Чипы категорий */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`badge cursor-pointer border transition-colors ${
              !cat ? "border-accent/60 bg-accent/20 text-accent-light" : "border-night-line bg-night-card text-white/60 hover:text-white"
            }`}
            onClick={() => setCat(null)}
          >
            {dict.all}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`badge cursor-pointer border transition-colors ${
                cat === c ? "border-accent/60 bg-accent/20 text-accent-light" : "border-night-line bg-night-card text-white/60 hover:text-white"
              }`}
              onClick={() => setCat(cat === c ? null : c)}
            >
              {categoryLabels[c] || c}
            </button>
          ))}
        </div>
      )}

      {/* Сетка рынков */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <EventCard key={e.slug} event={e} locale={locale} labels={cardLabels} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-10 text-center text-white/40">—</p>
      )}
    </div>
  );
}
