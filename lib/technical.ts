// lib/technical.ts — встроенный технический анализ по истории цены.
// Работает локально, без внешних ключей. Используется для «Нового прогноза»
// и как генератор анализа/прогноза, когда не задан OpenAI-ключ.

export type TechAnalysis = {
  direction: "UP" | "DOWN" | "SIDE";
  confidence: number; // 0-100
  trend: number; // наклон линейного тренда за период (% в день)
  volatility: number; // дневная волатильность (десятичная, напр. 0.02)
  rsi: number; // 0-100
  support: number[];
  resistance: number[];
  change30d: number; // % за ~30 дней
  lastPrice: number;
  summaryRu: string;
  summaryEn: string;
};

// Простое скользящее среднее
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
  return Math.sqrt(v);
}

function round(v: number, p = 2): number {
  return Math.round(v * 10 ** p) / 10 ** p;
}

export function analyzeHistory(
  history: { t: string; v: number }[],
  title: string,
  price?: number
): TechAnalysis | null {
  const closes = history.map((p) => p.v).filter((v) => v > 0 && isFinite(v));
  if (closes.length < 5) return null;

  const lastPrice = price && price > 0 ? price : closes[closes.length - 1];

  // Дневные доходности
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(closes[i] / closes[i - 1] - 1);
  const volatility = round(Math.max(stdDev(rets), 0.0005), 6) || 0.01;

  // RSI(14)
  let gains = 0;
  let losses = 0;
  const n = Math.min(14, rets.length);
  const recent = rets.slice(-n);
  recent.forEach((r) => {
    if (r >= 0) gains += r;
    else losses += -r;
  });
  const rsi = losses === 0 ? 100 : round(100 - 100 / (1 + gains / losses));

  // Линейный тренд (метод наименьших квадратов) за последние ~30 точек
  const horizon = Math.min(30, closes.length);
  const seg = closes.slice(-horizon);
  const xs = seg.map((_, i) => i);
  const n2 = seg.length;
  const xm = xs.reduce((a, b) => a + b, 0) / n2;
  const ym = seg.reduce((a, b) => a + b, 0) / n2;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n2; i++) {
    num += (xs[i] - xm) * (seg[i] - ym);
    den += (xs[i] - xm) ** 2;
  }
  const slope = den === 0 ? 0 : num / den; // изменение в пунктах/день
  const trend = den === 0 ? 0 : round((slope / ym) * 100, 4); // %/день

  const change30d = seg.length > 1 ? round(((seg[seg.length - 1] / seg[0] - 1) * 100), 2) : 0;

  // Ценовые кластеры -> уровни поддержки/сопротивления
  const sorted = [...closes].sort((a, b) => a - b);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const spread = Math.max((high - low) * 0.05, lastPrice * 0.005);
  const support = [...new Set([round(low), round(lastPrice - spread), round(lastPrice - spread * 1.6)])]
    .filter((v) => v > 0)
    .slice(0, 2);
  const resistance = [...new Set([round(high), round(lastPrice + spread), round(lastPrice + spread * 1.6)])]
    .filter((v) => v > 0)
    .slice(0, 2);

  // Направление и уверенность
  let direction: "UP" | "DOWN" | "SIDE";
  const score = trend * 100 + (rsi - 50) / 6; // тренд + импульс
  if (score > 1.2) direction = "UP";
  else if (score < -1.2) direction = "DOWN";
  else direction = "SIDE";

  let confidence = 50 + Math.min(35, Math.abs(score) * 6 + Math.abs(change30d) * 0.8);
  confidence = Math.round(Math.min(92, Math.max(40, confidence)));
  if (direction === "SIDE") confidence = Math.round(Math.min(70, confidence));

  const dirRu = direction === "UP" ? "роста" : direction === "DOWN" ? "падения" : "бокового движения";
  const dirEn = direction === "UP" ? "growth" : direction === "DOWN" ? "a decline" : "sideways movement";
  const trendRu = trend >= 0 ? `тренд умеренно восходящий (+${trend}%/день)` : `тренд умеренно нисходящий (${trend}%/день)`;
  const trendEn =
    trend >= 0 ? `trend is mildly upward (+${trend}%/day)` : `trend is mildly downward (${trend}%/day)`;
  const rsiRu = rsi > 70 ? "индикатор RSI указывает на перекупленность" : rsi < 30 ? "индикатор RSI указывает на перепроданность" : "индикатор RSI находится в нейтральной зоне";
  const rsiEn =
    rsi > 70 ? "RSI indicates overbought conditions" : rsi < 30 ? "RSI indicates oversold conditions" : "RSI is in a neutral zone";

  return {
    direction,
    confidence,
    trend,
    volatility,
    rsi,
    support,
    resistance,
    change30d,
    lastPrice: round(lastPrice),
    summaryRu:
      `Анализ по «${title}»: ${trendRu}, изменение за ~30 дней ${change30d >= 0 ? "+" : ""}${change30d}%. ` +
      `${rsiRu}. Ожидаем вероятность ${dirRu} ~${confidence}% к целевой дате. ` +
      `Ключевые уровни: поддержка ${support.join(", ")}, сопротивление ${resistance.join(", ")}.`,
    summaryEn:
      `Analysis for "${title}": ${trendEn}, ~30-day change ${change30d >= 0 ? "+" : ""}${change30d}%. ` +
      `${rsiEn}. The model estimates ~${confidence}% probability of ${dirEn} by the target date. ` +
      `Key levels: support ${support.join(", ")}, resistance ${resistance.join(", ")}.`,
  };
}

// Генерация прогнозной траектории на основе анализа (детерминированно)
export function buildTechPath(
  price: number,
  analysis: { direction: "UP" | "DOWN" | "SIDE"; trend: number; volatility: number },
  targetDate: Date,
  seedStr: string
): { series: { t: string; v: number }[]; targetDate: string; targetValue: number } {
  // Детерминированный ПСЧ на основе seed
  let s = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    s ^= seedStr.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  const rnd = () => {
    s = (Math.imul(s >>> 0, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const now = new Date();
  const target = targetDate.getTime() > now.getTime() + 86400000 ? targetDate : new Date(now.getTime() + 86400000);
  const days = Math.min(365, Math.max(1, Math.round((target.getTime() - now.getTime()) / 86400000)));
  const points = 40;
  const series: { t: string; v: number }[] = [];
  const dailyDrift =
    analysis.direction === "UP"
      ? Math.max(analysis.trend / 100, 0.0004)
      : analysis.direction === "DOWN"
      ? Math.min(analysis.trend / 100, -0.0004)
      : (rnd() - 0.5) * 0.0008;
  let v = price;
  series.push({ t: now.toISOString().slice(0, 10), v: Math.round(v * 100) / 100 });
  for (let i = 1; i < points; i++) {
    const noise = (rnd() - 0.5) * 2 * analysis.volatility;
    v = v * (1 + dailyDrift + noise);
    const d = new Date(now.getTime() + (i * days * 86400000) / points);
    series.push({ t: d.toISOString().slice(0, 10), v: Math.round(v * 100) / 100 });
  }
  return {
    series,
    targetDate: target.toISOString().slice(0, 10),
    targetValue: Math.round(series[series.length - 1].v * 100) / 100,
  };
}
