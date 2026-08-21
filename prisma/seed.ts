import { PrismaClient, EventCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function svgIcon(label: string, c1: string, c2: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='800' height='450' fill='url(#g)'/><text x='400' y='245' font-family='Arial, sans-serif' font-size='96' font-weight='bold' fill='rgba(255,255,255,0.95)' text-anchor='middle'>${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Deterministic pseudo-random walk (LCG), so the seed is reproducible.
function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function historyWalk(
  start: number,
  days: number,
  vol: number,
  seed: number
): { t: string; v: number }[] {
  const rnd = lcg(seed);
  const out: { t: string; v: number }[] = [];
  const now = Date.now();
  let v = start;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    out.push({ t: d.toISOString().slice(0, 10), v: Math.round(v * 100) / 100 });
    const drift = (rnd() - 0.48) * vol;
    v = v * (1 + drift);
  }
  return out;
}

async function main() {
  // ---- Users ----
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Администратор",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const userHash = await bcrypt.hash("user123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Демо-Пользователь",
      passwordHash: userHash,
    },
  });

  // ---- Events ----
  const events = [
    {
      slug: "gold",
      title: "Золото",
      titleEn: "Gold",
      description:
        "Прогноз цены золота (XAU/USD, $/унция). Анализ трендов, уровней поддержки и сопротивления, макро-факторов и волатильности. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Gold price forecast (XAU/USD, $/oz). Trend analysis, support/resistance levels, macro factors and volatility. AI forecast for the chosen date with a trajectory chart and direction probability.",
      category: EventCategory.GOLD,
      price: 10,
      currentPrice: 2331.2,
      label: "Au",
      c1: "#F59E0B",
      c2: "#B45309",
      vol: 0.012,
      seed: 11,
    },
    {
      slug: "oil",
      title: "Нефть Brent",
      titleEn: "Brent Oil",
      description:
        "Прогноз цены нефти марки Brent (USD/баррель). Учёт запасов, решений ОПЕК+, геополитики и сезонности спроса. ИИ-прогноз с уверенностью в направлении и ключевыми уровнями.",
      descriptionEn:
        "Brent crude oil price forecast (USD/barrel). Considers inventories, OPEC+ decisions, geopolitics and demand seasonality. AI forecast with direction confidence and key levels.",
      category: EventCategory.OIL,
      price: 10,
      currentPrice: 84.6,
      label: "Brent",
      c1: "#1E40AF",
      c2: "#0B1120",
      vol: 0.02,
      seed: 22,
    },
    {
      slug: "eurusd",
      title: "Доллар (EUR/USD)",
      titleEn: "US Dollar (EUR/USD)",
      description:
        "Прогноз курса евро к доллару. Анализ денежно-кредитной политики ФРС и ЕЦБ, инфляции и потоков капитала. Прогноз направления и целевого диапазона на дату.",
      descriptionEn:
        "EUR/USD exchange rate forecast. Analysis of Fed and ECB policy, inflation and capital flows. Direction and target range forecast for the date.",
      category: EventCategory.CURRENCY,
      price: 10,
      currentPrice: 1.0843,
      label: "€/$",
      c1: "#1E40AF",
      c2: "#2563EB",
      vol: 0.006,
      seed: 33,
    },
    {
      slug: "bitcoin",
      title: "Биткоин",
      titleEn: "Bitcoin",
      description:
        "Прогноз цены биткоина (BTC/USD). Учёт ончейн-метрик, халвингов, притока ETF и настроений рынка. ИИ-прогноз траектории и вероятности роста/падения на дату.",
      descriptionEn:
        "Bitcoin price forecast (BTC/USD). On-chain metrics, halvings, ETF inflows and market sentiment. AI trajectory forecast and up/down probability for the date.",
      category: EventCategory.CRYPTO,
      price: 10,
      currentPrice: 67240,
      label: "₿",
      c1: "#F59E0B",
      c2: "#7C2D12",
      vol: 0.03,
      seed: 44,
    },
    {
      slug: "fed-rate",
      title: "Ключевая ставка ФРС",
      titleEn: "Fed Funds Rate",
      description:
        "Прогноз по ключевой ставке ФРС и вероятности её изменения к выбранной дате. Анализ данных по инфляции, занятости и риторике FOMC.",
      descriptionEn:
        "Fed funds rate forecast and probability of a change by the chosen date. Inflation data, employment and FOMC rhetoric analysis.",
      category: EventCategory.RATES,
      price: 10,
      currentPrice: 5.5,
      label: "R",
      c1: "#0EA5E9",
      c2: "#1E40AF",
      vol: 0.004,
      seed: 55,
    },
    {
      slug: "sp500",
      title: "Индекс S&P 500",
      titleEn: "S&P 500 Index",
      description:
        "Прогноз индекса S&P 500 (пункты). Учёт сезонности, отчётностей, ставок и глобальных рисков. Прогноз уровня индекса и вероятности направления на дату.",
      descriptionEn:
        "S&P 500 index forecast (points). Seasonality, earnings, rates and global risks. Index level and direction probability forecast for the date.",
      category: EventCategory.OTHER,
      price: 10,
      currentPrice: 5218.4,
      label: "S&P",
      c1: "#10B981",
      c2: "#1E40AF",
      vol: 0.011,
      seed: 66,
    },
    {
      slug: "cpi-pce",
      title: "Инфляция (CPI / PCE)",
      titleEn: "Inflation (CPI / PCE)",
      description:
        "Прогноз инфляции по индексам CPI и PCE (США). Анализ динамики цен, базового эффекта, энерго- и пищевых компонентов. Прогноз значения индекса и реакции рынка на дату публикации.",
      descriptionEn:
        "US CPI and PCE inflation forecast. Price dynamics analysis, base effects, energy and food components. Index value and market reaction forecast for the release date.",
      category: EventCategory.RATES,
      price: 10,
      currentPrice: 3.4,
      label: "CPI",
      c1: "#EF4444",
      c2: "#B91C1C",
      vol: 0.008,
      seed: 77,
    },
    {
      slug: "gdp",
      title: "ВВП",
      titleEn: "GDP",
      description:
        "Прогноз ВВП США (квартальный, annualized). Учёт потребительских расходов, инвестиций, госзакупок и чистого экспорта. Прогноз темпа роста и влияния на политику ФРС.",
      descriptionEn:
        "US GDP forecast (quarterly, annualized). Considers consumer spending, investment, government purchases and net exports. Growth pace and Fed policy impact forecast.",
      category: EventCategory.RATES,
      price: 10,
      currentPrice: 2.8,
      label: "GDP",
      c1: "#0EA5E9",
      c2: "#0369A1",
      vol: 0.006,
      seed: 88,
    },
    {
      slug: "labor-market",
      title: "Рынок труда (безработица, NFP)",
      titleEn: "Labor Market (Unemployment, NFP)",
      description:
        "Прогноз по рынку труда: NFP (численность занятых вне фермерских хозяйств), уровень безработицы, средняя почасовая зарплата. Влияние на решения ФРС и волатильность долларов.",
      descriptionEn:
        "Labor market forecast: NFP (non-farm payrolls), unemployment rate, average hourly earnings. Impact on Fed decisions and dollar volatility.",
      category: EventCategory.RATES,
      price: 10,
      currentPrice: 3.9,
      label: "NFP",
      c1: "#8B5CF6",
      c2: "#5B21B6",
      vol: 0.007,
      seed: 99,
    },
    {
      slug: "pmi",
      title: "Промышленные индексы (PMI)",
      titleEn: "Industrial Indices (PMI)",
      description:
        "Прогноз по индексам деловой активности (Manufacturing PMI, Services PMI, Composite PMI) для США, ЕС и Китая. Ведущий индикатор рецессии/экспансии.",
      descriptionEn:
        "Business activity indices forecast (Manufacturing PMI, Services PMI, Composite PMI) for US, EU and China. Leading indicator of recession/expansion.",
      category: EventCategory.RATES,
      price: 10,
      currentPrice: 51.2,
      label: "PMI",
      c1: "#10B981",
      c2: "#065F46",
      vol: 0.005,
      seed: 110,
    },
    {
      slug: "spacex-ipo",
      title: "IPO SpaceX",
      titleEn: "SpaceX IPO",
      description:
        "Прогноз оценки и цены размещения SpaceX при IPO. Учёт контрактов NASA/DoD, Starlink, Starship, приватных раундов. Сценарии оценки $150–250 млрд.",
      descriptionEn:
        "SpaceX IPO valuation and offer price forecast. NASA/DoD contracts, Starlink, Starship, private rounds considered. Valuation scenarios $150–250B.",
      category: EventCategory.OTHER,
      price: 10,
      currentPrice: 180,
      label: "SX",
      c1: "#6366F1",
      c2: "#312E81",
      vol: 0.025,
      seed: 121,
    },
    {
      slug: "openai-ipo",
      title: "IPO OpenAI",
      titleEn: "OpenAI IPO",
      description:
        "Прогноз оценки и цены размещения OpenAI при IPO. Учёт выручки ChatGPT/Enterprise, партнёрства с Microsoft, 경쟁инга, регуляторики. Сценарии $100–200 млрд.",
      descriptionEn:
        "OpenAI IPO valuation and offer price forecast. ChatGPT/Enterprise revenue, Microsoft partnership, competition, regulation. Valuation scenarios $100–200B.",
      category: EventCategory.OTHER,
      price: 10,
      currentPrice: 120,
      label: "OAI",
      c1: "#EC4899",
      c2: "#831843",
      vol: 0.025,
      seed: 132,
    },
  ];

  for (const e of events) {
    const chartData = historyWalk(e.currentPrice, 40, e.vol, e.seed);
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        currentPrice: e.currentPrice,
        chartData,
      },
      create: {
        slug: e.slug,
        title: e.title,
        titleEn: e.titleEn,
        description: e.description,
        descriptionEn: e.descriptionEn,
        category: e.category,
        price: e.price,
        currency: "EUR",
        currentPrice: e.currentPrice,
        chartData,
        imageUrl: svgIcon(e.label, e.c1, e.c2),
      },
    });
  }

  // ---- Demo forecasts for the demo user (leaderboard / dashboard demo) ----
  const gold = await prisma.event.findUniqueOrThrow({ where: { slug: "gold" } });
  const btc = await prisma.event.findUniqueOrThrow({ where: { slug: "bitcoin" } });
  const eurusd = await prisma.event.findUniqueOrThrow({ where: { slug: "eurusd" } });

  const demoForecasts = [
    {
      eventId: gold.id,
      targetDate: new Date(Date.now() + 7 * 86400000),
      direction: "UP",
      confidence: 74,
      summary:
        "Золото сохраняет восходящий тренд на фоне мягкой денежно-кредитной политики и спроса центральных банков. Цель — зона 2380–2420 $/унцию, поддержка 2285 $.",
      summaryEn:
        "Gold keeps an uptrend amid accommodative policy and central bank demand. Target zone 2380–2420 $/oz, support at 2285 $.",
      priceAtRequest: 2311.5,
      isCorrect: true,
    },
    {
      eventId: btc.id,
      targetDate: new Date(Date.now() + 14 * 86400000),
      direction: "DOWN",
      confidence: 61,
      summary:
        "Биткоин консолидируется после роста; перегрев и фиксация прибыли повышают риск коррекции к 58000–60000 $. Долгосрочный тренд остаётся бычьим.",
      summaryEn:
        "Bitcoin consolidates after the rally; overextension and profit-taking raise the risk of a correction toward 58000–60000 $. The long-term trend stays bullish.",
      priceAtRequest: 68900,
      isCorrect: true,
    },
    {
      eventId: eurusd.id,
      targetDate: new Date(Date.now() + 21 * 86400000),
      direction: "UP",
      confidence: 58,
      summary:
        "Ожидаем умеренного укрепления евро к 1.0950–1.1020 на расхождении в ставках. Риск — сильные данные по США.",
      summaryEn:
        "Expecting a moderate euro appreciation to 1.0950–1.1020 on rate divergence. Risk: strong US data.",
      priceAtRequest: 1.0791,
      isCorrect: false,
    },
    {
      eventId: gold.id,
      targetDate: new Date(Date.now() + 30 * 86400000),
      direction: "UP",
      confidence: 66,
      summary:
        "Сезонный спрос и геополитические риски поддерживают золото. Целевой диапазон 2400–2480 $/унцию к горизонту месяца.",
      summaryEn:
        "Seasonal demand and geopolitical risks support gold. Target range 2400–2480 $/oz on a one-month horizon.",
      priceAtRequest: 2331.2,
      isCorrect: null,
    },
  ];

  for (const f of demoForecasts) {
    const existing = await prisma.forecast.findFirst({
      where: { userId: demoUser.id, eventId: f.eventId, summary: f.summary },
    });
    if (existing) continue;
    const forecast = await prisma.forecast.create({
      data: {
        userId: demoUser.id,
        eventId: f.eventId,
        targetDate: f.targetDate,
        status: "READY",
        direction: f.direction,
        confidence: f.confidence,
        summary: f.summary,
        summaryEn: f.summaryEn,
        priceAtRequest: f.priceAtRequest,
        isCorrect: f.isCorrect,
        keyLevels: {
          support: [f.priceAtRequest * 0.97, f.priceAtRequest * 0.95],
          resistance: [f.priceAtRequest * 1.03, f.priceAtRequest * 1.06],
        },
        chartData: {
          series: historyWalk(f.priceAtRequest, 30, 0.012, 77),
          targetDate: f.targetDate.toISOString().slice(0, 10),
          targetValue: f.priceAtRequest * (f.direction === "UP" ? 1.035 : 0.965),
        },
      },
    });
    await prisma.payment.create({
      data: {
        userId: demoUser.id,
        eventId: f.eventId,
        forecastId: forecast.id,
        stripeSessionId: "seed_" + forecast.id,
        amount: 10,
        currency: "EUR",
        status: "PAID",
      },
    });
  }

  console.log("Seed completed. Admin: admin@example.com / admin123; Demo user: user@example.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
