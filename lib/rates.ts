// lib/rates.ts — живые курсы валютных пар с историей из бесплатных источников:
//   актуальный курс: open.er-api.com (включает RUB)
//   история (не-RUB): api.frankfurter.app (данные ЕЦБ)
//   история (к рублю): ЦБ РФ (www.cbr.ru, XML_daily)
// Результат кэшируется в памяти процесса на 5 минут, чтобы не дёргать внешние API на каждый заход.

export type PairRate = {
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

type PairDef = {
  pair: string;
  slug: string;
  labelRu: string;
  labelEn: string;
  groups: string[];
  feat?: "rub" | "usd" | "eur";
  /** Ключевые слова для фото-фона окошка (рисунок соответствует названию). */
  photoKw: string;
};

const PAIRS: PairDef[] = [
  { pair: "USD/RUB", slug: "usd-rub", labelRu: "Доллар США / рубль", labelEn: "US Dollar / Ruble", groups: ["rub"], feat: "rub", photoKw: "dollar,ruble,banknotes" },
  { pair: "EUR/RUB", slug: "eur-rub", labelRu: "Евро / рубль", labelEn: "Euro / Ruble", groups: ["eur"], feat: "eur", photoKw: "euro,ruble,banknotes" },
  { pair: "CNY/RUB", slug: "cny-rub", labelRu: "Юань / рубль", labelEn: "Yuan / Ruble", groups: ["rub"], photoKw: "yuan,ruble,currency" },
  { pair: "EUR/USD", slug: "eur-usd", labelRu: "Евро / доллар США", labelEn: "Euro / US Dollar", groups: ["usd", "eur"], feat: "usd", photoKw: "euro,dollar,currency" },
  { pair: "GBP/USD", slug: "gbp-usd", labelRu: "Фунт / доллар США", labelEn: "Pound / US Dollar", groups: ["usd"], photoKw: "pound,dollar,banknotes" },
  { pair: "USD/JPY", slug: "usd-jpy", labelRu: "Доллар США / иена", labelEn: "US Dollar / Yen", groups: ["usd"], photoKw: "dollar,yen,japan" },
  { pair: "USD/CHF", slug: "usd-chf", labelRu: "Доллар США / франк", labelEn: "US Dollar / Franc", groups: ["usd", "other"], photoKw: "dollar,swiss,franc" },
  { pair: "EUR/GBP", slug: "eur-gbp", labelRu: "Евро / фунт", labelEn: "Euro / Pound", groups: ["eur"], photoKw: "euro,pound,banknotes" },
  { pair: "EUR/JPY", slug: "eur-jpy", labelRu: "Евро / иена", labelEn: "Euro / Yen", groups: ["eur"], photoKw: "euro,yen,japan" },
  { pair: "AUD/USD", slug: "aud-usd", labelRu: "Австралийский доллар / USD", labelEn: "Australian Dollar / USD", groups: ["other"], photoKw: "australian,dollar,currency" },
  { pair: "USD/CAD", slug: "usd-cad", labelRu: "Доллар США / канадский доллар", labelEn: "USD / Canadian Dollar", groups: ["other"], photoKw: "dollar,canada,currency" },
  { pair: "NZD/USD", slug: "nzd-usd", labelRu: "Новозеландский доллар / USD", labelEn: "New Zealand Dollar / USD", groups: ["other"], photoKw: "dollar,newzealand" },
  { pair: "USD/CNY", slug: "usd-cny", labelRu: "Доллар США / юань", labelEn: "USD / Chinese Yuan", groups: ["other"], photoKw: "dollar,yuan,china" },
  { pair: "USD/TRY", slug: "usd-try", labelRu: "Доллар США / турецкая лира", labelEn: "USD / Turkish Lira", groups: ["other"], photoKw: "dollar,lira,turkey" },
];

// Коды ЦБ РФ для истории пар к рублю
const CBR_IDS: Record<string, string> = {
  USD: "R01235",
  EUR: "R01239",
  CNY: "R01375",
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { ts: number; data: PairRate[] } | null = null;

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Курс ЦБ РФ (RUB за единицу) на дату. */
async function cbrRate(date: Date): Promise<Record<string, number> | null> {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dd}/${mm}/${yyyy}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const xml = await res.text();
    const out: Record<string, number> = {};
    for (const [code, id] of Object.entries(CBR_IDS)) {
      const m = xml.match(new RegExp(`<Valute ID="${id}">[\\s\\S]*?<Value>([\\d\\s,]+)</Value>`));
      if (!m) continue;
      const v = parseFloat((m[1] as string).replace(/\s/g, "").replace(",", "."));
      if (isFinite(v) && v > 0) out[code] = v;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** История USD/RUB, EUR/RUB, CNY/RUB за последние ~30 рабочих дней ЦБ. */
async function rubHistory(): Promise<Record<string, { t: string; v: number }[]>> {
  const out: Record<string, { t: string; v: number }[]> = {};
  const end = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    if (isWeekend(d)) continue;
    const key = d.toISOString().slice(0, 10);
    const rates = await cbrRate(d);
    if (!rates) continue;
    for (const code of Object.keys(CBR_IDS)) {
      if (!rates[code]) continue;
      const arr = (out[code] ??= []);
      if (arr.length && arr[arr.length - 1].v === rates[code]) continue;
      arr.push({ t: key, v: rates[code] });
    }
  }
  // только последние ~30 точек на пару
  for (const code of Object.keys(out)) out[code] = out[code].slice(0, 30);
  return out;
}

async function fxHistory(from: string, to: string): Promise<{ t: string; v: number }[] | null> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 60);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const data = (await fetchJson(
    `https://api.frankfurter.app/${iso(start)}..${iso(end)}?from=${from}&to=${to}`
  )) as { rates?: Record<string, Record<string, number>> } | null;
  if (!data?.rates) return null;
  const points = Object.entries(data.rates)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, r]) => ({ t, v: r[to] }))
    .filter((p) => isFinite(p.v) && p.v > 0);
  return points.length > 1 ? points.slice(-30) : null;
}

function round(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function withChange(p: { t: string; v: number }[]): { changePct: number | null } {
  if (!p || p.length < 2) return { changePct: null };
  const first = p[0].v;
  const last = p[p.length - 1].v;
  return { changePct: first > 0 ? Math.round(((last - first) / first) * 10000) / 100 : null };
}

export async function getRatesSummary(): Promise<PairRate[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;

  // 1) актуальные курсы
  const latest: Record<string, Record<string, number> | null> = {};
  const bases = [...new Set(PAIRS.map((p) => p.pair.split("/")[0]))];
  for (const base of bases) {
    const data = (await fetchJson(
      `https://open.er-api.com/v6/latest/${base}`
    )) as { rates?: Record<string, number> } | null;
    latest[base] = data?.rates ?? null;
  }

  // 2) история
  const rubHist = await rubHistory();
  const fxCaches: Record<string, { t: string; v: number }[] | null> = {};

  const result: PairRate[] = [];
  for (const def of PAIRS) {
    const [from, to] = def.pair.split("/");
    const rates = latest[from];
    const price = rates && rates[to] ? round(rates[to]) : null;

    let history: { t: string; v: number }[] | null = null;
    if (to === "RUB") {
      history = rubHist[from] ?? null;
    } else {
      const cacheKey = `${from}\u0000${to}`;
      if (!(cacheKey in fxCaches)) fxCaches[cacheKey] = await fxHistory(from, to);
      history = fxCaches[cacheKey];
    }

    result.push({
      pair: def.pair,
      slug: def.slug,
      labelRu: def.labelRu,
      labelEn: def.labelEn,
      groups: def.groups,
      feat: def.feat,
      price,
      currency: to,
      ...withChange(history ?? []),
      history,
      photo: `https://loremflickr.com/640/360/${encodeURIComponent(def.photoKw)}`,
    });
  }

  cache = { ts: Date.now(), data: result };
  return result;
}