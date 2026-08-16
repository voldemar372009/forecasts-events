import { prisma } from "./prisma";

export type ForecastPayload = {
  direction: "UP" | "DOWN" | "SIDE";
  confidence: number; // 0-100
  summaryRu: string;
  summaryEn: string;
  support: number[];
  resistance: number[];
  drift: number; // daily drift, e.g. 0.002 = +0.2%/day
  volatility: number; // daily volatility, e.g. 0.015
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function buildChartPath(
  priceAtRequest: number,
  payload: ForecastPayload,
  targetDate: Date,
  seedStr: string
): { series: { t: string; v: number }[]; targetDate: string; targetValue: number } {
  const rnd = lcg(hashSeed(seedStr));
  const now = new Date();
  const target = targetDate.getTime() > now.getTime() + 86400000 ? targetDate : new Date(now.getTime() + 86400000);
  const days = clamp(Math.round((target.getTime() - now.getTime()) / 86400000), 1, 365);
  const points = 40;
  const series: { t: string; v: number }[] = [];
  let v = priceAtRequest;
  series.push({ t: now.toISOString().slice(0, 10), v: Math.round(v * 100) / 100 });
  for (let i = 1; i < points; i++) {
    const noise = (rnd() - 0.5) * 2 * payload.volatility;
    v = v * (1 + payload.drift + noise);
    const d = new Date(now.getTime() + (i * days * 86400000) / points);
    series.push({ t: d.toISOString().slice(0, 10), v: Math.round(v * 100) / 100 });
  }
  return {
    series,
    targetDate: target.toISOString().slice(0, 10),
    targetValue: Math.round(series[series.length - 1].v * 100) / 100,
  };
}

function mockPayload(event: { title: string; category: string }, price: number, targetDate: Date): ForecastPayload {
  const rnd = lcg(hashSeed(event.title + targetDate.toISOString().slice(0, 10)));
  const r = rnd();
  const direction: "UP" | "DOWN" | "SIDE" = r > 0.93 ? "SIDE" : r > 0.42 ? "UP" : "DOWN";
  const confidence = Math.round(55 + rnd() * 30);
  const volByCategory: Record<string, number> = {
    CRYPTO: 0.03,
    OIL: 0.02,
    GOLD: 0.012,
    CURRENCY: 0.006,
    RATES: 0.004,
    OTHER: 0.011,
  };
  const volatility = volByCategory[event.category] ?? 0.015;
  const drift =
    direction === "UP" ? 0.0008 + rnd() * 0.0025 : direction === "DOWN" ? -(0.0008 + rnd() * 0.0025) : (rnd() - 0.5) * 0.0006;
  const spread = 0.5 + rnd() * 2.5; // percent
  const dateStr = targetDate.toISOString().slice(0, 10);
  const dirRu = direction === "UP" ? "роста" : direction === "DOWN" ? "падения" : "бокового движения";
  const dirEn = direction === "UP" ? "growth" : direction === "DOWN" ? "a decline" : "sideways movement";
  return {
    direction,
    confidence,
    summaryRu: `ДЕМО-прогноз по «${event.title}»: модель оценивает вероятность ${dirRu} в ${confidence}% к дате ${dateStr}. Текущий уровень — ${price}. Рекомендуем подключить ключ OpenAI для полноценной аналитики.`,
    summaryEn: `DEMO forecast for "${event.title}": the model estimates the probability of ${dirEn} at ${confidence}% by ${dateStr}. Current level is ${price}. Connect an OpenAI key for full analytics.`,
    support: [Math.round(price * (1 - spread / 100) * 100) / 100, Math.round(price * (1 - (spread * 1.8) / 100) * 100) / 100],
    resistance: [Math.round(price * (1 + spread / 100) * 100) / 100, Math.round(price * (1 + (spread * 1.8) / 100) * 100) / 100],
    drift,
    volatility,
  };
}

async function callOpenAI(args: {
  apiKey: string;
  event: { title: string; category: string };
  price: number;
  targetDate: Date;
  history?: { t: string; v: number }[] | null;
}): Promise<ForecastPayload> {
  const { apiKey, event, price, targetDate } = args;
  const dateStr = targetDate.toISOString().slice(0, 10);
  const system =
    "You are a senior financial analyst. Provide an objective AI forecast. " +
    "Always answer with strict JSON only, no markdown, with keys: " +
    "direction (\"UP\"|\"DOWN\"|\"SIDE\"), confidence (integer 0-100), summaryRu (120-300 chars, Russian), " +
    "summaryEn (120-300 chars, English), support (array of 2 numbers), resistance (array of 2 numbers), " +
    "drift (daily expected change as decimal, e.g. 0.0015), volatility (daily volatility as decimal, e.g. 0.02). " +
    "Values must be consistent with the direction and confidence.";
  const user = `Event: ${event.title} (category: ${event.category}). ` +
    `Current price: ${price}. ` +
    (args.history && args.history.length
      ? `Recent daily closes: ${args.history.slice(-14).map((p) => `${p.t}:${p.v}`).join(", ")}. `
      : "") +
    `Forecast target date: ${dateStr}. ` +
    "Generate the forecast.";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const direction = parsed.direction === "DOWN" ? "DOWN" : parsed.direction === "SIDE" ? "SIDE" : "UP";
  const confidence = clamp(Math.round(Number(parsed.confidence) || 50), 0, 100);
  const toArr = (v: unknown): number[] =>
    Array.isArray(v) ? v.slice(0, 2).map((x) => Number(x) || 0) : [];
  return {
    direction,
    confidence,
    summaryRu: String(parsed.summaryRu || "").slice(0, 600) || "Прогноз сформирован.",
    summaryEn: String(parsed.summaryEn || "").slice(0, 600) || "Forecast generated.",
    support: toArr(parsed.support),
    resistance: toArr(parsed.resistance),
    drift: clamp(Number(parsed.drift) || 0, -0.05, 0.05),
    volatility: clamp(Number(parsed.volatility) || 0.01, 0.001, 0.1),
  };
}

export async function generateForecast(forecastId: string): Promise<void> {
  const forecast = await prisma.forecast.findUnique({
    where: { id: forecastId },
    include: { event: true },
  });
  if (!forecast) return;
  const event = forecast.event;
  const price = Number(forecast.priceAtRequest ?? event.currentPrice ?? 0) || 0;
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const history = Array.isArray(event.chartData)
      ? (event.chartData as { t: string; v: number }[])
      : null;
    let payload: ForecastPayload;
    if (apiKey) {
      payload = await callOpenAI({ apiKey, event, price, targetDate: forecast.targetDate, history });
    } else if (process.env.NODE_ENV !== "production") {
      payload = mockPayload(event, price, forecast.targetDate);
    } else {
      throw new Error("OPENAI_API_KEY is not set");
    }
    const chartData = buildChartPath(price, payload, forecast.targetDate, forecast.id);
    await prisma.forecast.update({
      where: { id: forecastId },
      data: {
        status: "READY",
        direction: payload.direction,
        confidence: payload.confidence,
        summary: payload.summaryRu,
        summaryEn: payload.summaryEn,
        keyLevels: { support: payload.support, resistance: payload.resistance },
        chartData,
        errorMessage: null,
      },
    });
  } catch (e) {
    await prisma.forecast.update({
      where: { id: forecastId },
      data: { status: "FAILED", errorMessage: (e as Error).message },
    });
  }
}
