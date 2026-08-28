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

  // ---- Валютные пары («Курс валют» на странице категории Экономика) ----
  // Те же «окна», что и на главной: размытое фото по названию пары,
  // кнопка «Открыть» → страница прогноза с графиком, датой, ценой 10$ и описанием.
  const currencyPairs = [
    {
      slug: "usd-rub",
      title: "Доллар США / рубль (USD/RUB)",
      titleEn: "US Dollar / Ruble (USD/RUB)",
      currentPrice: 85.8724,
      vol: 0.008,
      seed: 201,
      photoKw: "dollar,ruble,banknotes",
      description:
        "Прогноз курса доллара США к рублю (USD/RUB). Анализ денежно-кредитной политики ФРС и ЦБ РФ, цен на нефть, капитальных потоков и геополитических факторов. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "USD/RUB exchange rate forecast. Analysis of Fed and CBR policy, oil prices, capital flows and geopolitical factors. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "eur-rub",
      title: "Евро / рубль (EUR/RUB)",
      titleEn: "Euro / Ruble (EUR/RUB)",
      currentPrice: 96.7486,
      vol: 0.008,
      seed: 202,
      photoKw: "euro,ruble,banknotes",
      description:
        "Прогноз курса евро к рублю (EUR/RUB). Учёт ставок ЕЦБ и ЦБ РФ, торгового баланса, динамики нефти и санкционных рисков. ИИ-прогноз направления и целевого диапазона на выбранную дату.",
      descriptionEn:
        "EUR/RUB exchange rate forecast. ECB and CBR rates, trade balance, oil dynamics and sanctions risks. AI direction and target range forecast for the chosen date.",
    },
    {
      slug: "cny-rub",
      title: "Юань / рубль (CNY/RUB)",
      titleEn: "Yuan / Ruble (CNY/RUB)",
      currentPrice: 12.5471,
      vol: 0.006,
      seed: 203,
      photoKw: "yuan,ruble,currency",
      description:
        "Прогноз курса китайского юаня к рублю (CNY/RUB). Анализ торговых потоков Россия–Китай, валютных интервенций и товарооборота. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "CNY/RUB exchange rate forecast. Russia–China trade flows, currency interventions and bilateral trade analysis. AI forecast for the chosen date with direction probability.",
    },
    {
      slug: "eur-usd",
      title: "Евро / доллар США (EUR/USD)",
      titleEn: "Euro / US Dollar (EUR/USD)",
      currentPrice: 1.1564,
      vol: 0.005,
      seed: 204,
      photoKw: "euro,dollar,currency",
      description:
        "Прогноз курса евро к доллару (EUR/USD). Анализ денежно-кредитной политики ФРС и ЕЦБ, инфляции и потоков капитала. Прогноз направления и целевого диапазона на дату.",
      descriptionEn:
        "EUR/USD exchange rate forecast. Fed and ECB policy, inflation and capital flows analysis. Direction and target range forecast for the date.",
    },
    {
      slug: "gbp-usd",
      title: "Фунт / доллар США (GBP/USD)",
      titleEn: "Pound / US Dollar (GBP/USD)",
      currentPrice: 1.359,
      vol: 0.006,
      seed: 205,
      photoKw: "pound,dollar,banknotes",
      description:
        "Прогноз курса британского фунта к доллару (GBP/USD). Учёт решений Банка Англии, инфляции в Великобритании и макро-данных США. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "GBP/USD exchange rate forecast. Bank of England decisions, UK inflation and US macro data. AI forecast for the chosen date.",
    },
    {
      slug: "usd-jpy",
      title: "Доллар США / иена (USD/JPY)",
      titleEn: "US Dollar / Yen (USD/JPY)",
      currentPrice: 159.3272,
      vol: 0.007,
      seed: 206,
      photoKw: "dollar,yen,japan",
      description:
        "Прогноз курса доллара США к японской иене (USD/JPY). Анализ политики Банка Японии, спреда доходностей и риск-аппетита рынков. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "USD/JPY exchange rate forecast. Bank of Japan policy, yield spread and market risk appetite analysis. AI forecast for the chosen date.",
    },
    {
      slug: "usd-chf",
      title: "Доллар США / франк (USD/CHF)",
      titleEn: "US Dollar / Franc (USD/CHF)",
      currentPrice: 0.8042,
      vol: 0.005,
      seed: 207,
      photoKw: "dollar,swiss,franc",
      description:
        "Прогноз курса доллара США к швейцарскому франку (USD/CHF). Учёт политики ШНБ, статуса франка как защитного актива и ставок ФРС. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "USD/CHF exchange rate forecast. SNB policy, franc safe-haven status and Fed rates. AI forecast for the chosen date.",
    },
    {
      slug: "eur-gbp",
      title: "Евро / фунт (EUR/GBP)",
      titleEn: "Euro / Pound (EUR/GBP)",
      currentPrice: 0.8547,
      vol: 0.004,
      seed: 208,
      photoKw: "euro,pound,banknotes",
      description:
        "Прогноз курса евро к британскому фунту (EUR/GBP). Сравнение макро-данных ЕС и Великобритании, ставок ЕЦБ и Банка Англии. ИИ-прогноз направления на дату.",
      descriptionEn:
        "EUR/GBP exchange rate forecast. EU vs UK macro data, ECB and BoE rates comparison. AI direction forecast for the date.",
    },
    {
      slug: "eur-jpy",
      title: "Евро / иена (EUR/JPY)",
      titleEn: "Euro / Yen (EUR/JPY)",
      currentPrice: 184.1418,
      vol: 0.006,
      seed: 209,
      photoKw: "euro,yen,japan",
      description:
        "Прогноз курса евро к японской иене (EUR/JPY). Анализ ставок ЕЦБ и Банка Японии, глобального риск-аппетита. ИИ-прогноз на выбранную дату с графиком траектории.",
      descriptionEn:
        "EUR/JPY exchange rate forecast. ECB and BoJ rates, global risk appetite analysis. AI forecast for the chosen date with a trajectory chart.",
    },
    {
      slug: "aud-usd",
      title: "Австралийский доллар / USD (AUD/USD)",
      titleEn: "Australian Dollar / USD (AUD/USD)",
      currentPrice: 0.7192,
      vol: 0.007,
      seed: 210,
      photoKw: "australian,dollar,currency",
      description:
        "Прогноз курса австралийского доллара к доллару США (AUD/USD). Учёт цен на сырьё, ставок РБА и экономики Китая. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "AUD/USD exchange rate forecast. Commodity prices, RBA rates and China economy. AI forecast for the chosen date.",
    },
    {
      slug: "usd-cad",
      title: "Доллар США / канадский доллар (USD/CAD)",
      titleEn: "USD / Canadian Dollar (USD/CAD)",
      currentPrice: 1.3858,
      vol: 0.006,
      seed: 211,
      photoKw: "dollar,canada,currency",
      description:
        "Прогноз курса доллара США к канадскому доллару (USD/CAD). Анализ цен на нефть, ставок Банка Канады и торговых отношений США–Канада. ИИ-прогноз на дату.",
      descriptionEn:
        "USD/CAD exchange rate forecast. Oil prices, Bank of Canada rates and US–Canada trade relations. AI forecast for the date.",
    },
    {
      slug: "nzd-usd",
      title: "Новозеландский доллар / USD (NZD/USD)",
      titleEn: "New Zealand Dollar / USD (NZD/USD)",
      currentPrice: 0.5953,
      vol: 0.007,
      seed: 212,
      photoKw: "dollar,newzealand",
      description:
        "Прогноз курса новозеландского доллара к доллару США (NZD/USD). Учёт ставок РБНЗ, цен на молочную продукцию и глобального риск-аппетита. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "NZD/USD exchange rate forecast. RBNZ rates, dairy prices and global risk appetite. AI forecast for the chosen date.",
    },
    {
      slug: "usd-cny",
      title: "Доллар США / юань (USD/CNY)",
      titleEn: "USD / Chinese Yuan (USD/CNY)",
      currentPrice: 6.7372,
      vol: 0.004,
      seed: 213,
      photoKw: "dollar,yuan,china",
      description:
        "Прогноз курса доллара США к китайскому юаню (USD/CNY). Анализ политики Народного банка Китая, торгового баланса и ставок ФРС. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "USD/CNY exchange rate forecast. PBoC policy, trade balance and Fed rates analysis. AI forecast for the chosen date.",
    },
    {
      slug: "usd-try",
      title: "Доллар США / турецкая лира (USD/TRY)",
      titleEn: "USD / Turkish Lira (USD/TRY)",
      currentPrice: 48.1625,
      vol: 0.01,
      seed: 214,
      photoKw: "dollar,lira,turkey",
      description:
        "Прогноз курса доллара США к турецкой лире (USD/TRY). Учёт инфляции в Турции, ставок ЦБ Турции и политических рисков. ИИ-прогноз на выбранную дату.",
      descriptionEn:
        "USD/TRY exchange rate forecast. Turkish inflation, CBT rates and political risks. AI forecast for the chosen date.",
    },
  ];

  for (const p of currencyPairs) {
    const chartData = historyWalk(p.currentPrice, 40, p.vol, p.seed);
    await prisma.event.upsert({
      where: { slug: p.slug },
      update: {
        currentPrice: p.currentPrice,
        chartData,
      },
      create: {
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        description: p.description,
        descriptionEn: p.descriptionEn,
        category: EventCategory.CURRENCY,
        price: 10,
        currency: "EUR",
        currentPrice: p.currentPrice,
        chartData,
        imageUrl: `https://loremflickr.com/640/360/${encodeURIComponent(p.photoKw)}`,
      },
    });
  }

  // ---- Динамика фондовых индексов (под «Курсом валют» на странице Экономика) ----
  // Окно с тремя окошками: акции, мировые биржи, российские биржи.
  const stockIndexes = [
    {
      slug: "stock-dynamics",
      title: "Динамика акций",
      titleEn: "Stock Dynamics",
      currentPrice: 5218.4,
      vol: 0.011,
      seed: 301,
      photoKw: "stocks,market,chart",
      description:
        "Прогноз динамики рынка акций: мировые фондовые индексы, отраслевые тренды, корпоративная отчётность и потоки капитала. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Stock market dynamics forecast: global equity indices, sector trends, corporate earnings and capital flows. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "world-exchanges",
      title: "Динамика основных показателей мировых бирж",
      titleEn: "Major World Exchanges",
      currentPrice: 3450.2,
      vol: 0.009,
      seed: 302,
      photoKw: "world,exchange,stockmarket",
      description:
        "Прогноз ключевых показателей мировых бирж (NYSE, NASDAQ, LSE, TSE, Euronext): капитализация, объёмы торгов, динамика индексов. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "Forecast of key indicators for major world exchanges (NYSE, NASDAQ, LSE, TSE, Euronext): market cap, trading volumes, index dynamics. AI forecast for the chosen date with direction probability.",
    },
    {
      slug: "russian-exchanges",
      title: "Динамика основных показателей российских бирж",
      titleEn: "Russian Exchanges",
      currentPrice: 3124.8,
      vol: 0.013,
      seed: 303,
      photoKw: "moscow,exchange,russia",
      description:
        "Прогноз основных показателей российских бирж (МосБиржа, СПБ Биржа): индекс IMOEX, ликвидность, объёмы торгов, ставка ЦБ. ИИ-прогноз на выбранную дату с графиком траектории.",
      descriptionEn:
        "Forecast of key indicators for Russian exchanges (MOEX, SPB Exchange): IMOEX index, liquidity, trading volumes, CBR rate. AI forecast for the chosen date with a trajectory chart.",
    },
  ];

  for (const ix of stockIndexes) {
    const chartData = historyWalk(ix.currentPrice, 40, ix.vol, ix.seed);
    await prisma.event.upsert({
      where: { slug: ix.slug },
      update: {
        currentPrice: ix.currentPrice,
        chartData,
      },
      create: {
        slug: ix.slug,
        title: ix.title,
        titleEn: ix.titleEn,
        description: ix.description,
        descriptionEn: ix.descriptionEn,
        category: EventCategory.OTHER,
        price: 10,
        currency: "EUR",
        currentPrice: ix.currentPrice,
        chartData,
        imageUrl: `https://loremflickr.com/640/360/${encodeURIComponent(ix.photoKw)}`,
      },
    });
  }

  // ---- Политика и геополитика (окно «Политика и геополитика» на странице Политика) ----
  // Главное окошко с тремя окошками внутри: президентские выборы, парламентские выборы, праймериз.
  const politicsEvents = [
    {
      slug: "presidential-elections",
      title: "Выборы президентские",
      titleEn: "Presidential Elections",
      currentPrice: 50,
      vol: 0.02,
      seed: 401,
      photoKw: "election,voting,president",
      description:
        "Прогноз по президентским выборам: шансы кандидатов, явка избирателей, сценарии второго тура и влияние исхода на геополитику и рынки. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Presidential elections forecast: candidates' chances, voter turnout, runoff scenarios and the impact of the outcome on geopolitics and markets. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "parliamentary-elections",
      title: "Выборы парламентские",
      titleEn: "Parliamentary Elections",
      currentPrice: 48.5,
      vol: 0.018,
      seed: 402,
      photoKw: "parliament,election,government",
      description:
        "Прогноз по парламентским выборам: распределение мест, возможные коалиции, явка и влияние на законодательную повестку. ИИ-прогноз на выбранную дату с вероятностью направления и ключевыми сценариями.",
      descriptionEn:
        "Parliamentary elections forecast: seat distribution, possible coalitions, turnout and the impact on the legislative agenda. AI forecast for the chosen date with direction probability and key scenarios.",
    },
    {
      slug: "primaries",
      title: "Праймериз",
      titleEn: "Primaries",
      currentPrice: 52.3,
      vol: 0.025,
      seed: 403,
      photoKw: "primaries,voting,campaign",
      description:
        "Прогноз по праймериз: лидеры внутрипартийной гонки, рейтинги кандидатов, ключевые штаты и регионы, сценарии выдвижения. ИИ-прогноз на выбранную дату с графиком траектории.",
      descriptionEn:
        "Primaries forecast: leaders of the internal party race, candidate ratings, key states and regions, nomination scenarios. AI forecast for the chosen date with a trajectory chart.",
    },
  ];

  for (const p of politicsEvents) {
    const chartData = historyWalk(p.currentPrice, 40, p.vol, p.seed);
    await prisma.event.upsert({
      where: { slug: p.slug },
      update: {
        currentPrice: p.currentPrice,
        chartData,
      },
      create: {
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        description: p.description,
        descriptionEn: p.descriptionEn,
        category: EventCategory.POLITICS,
        price: 10,
        currency: "EUR",
        currentPrice: p.currentPrice,
        chartData,
        imageUrl: `https://loremflickr.com/640/360/${encodeURIComponent(p.photoKw)}`,
      },
    });
  }

  // ---- Спорт (главное окно «Спорт» на странице категории Спорт) ----
  // Окна: Чемпионат мира по футболу, Олимпийские игры, Супербоул,
  // «Популярные лиги» (НБА, АПЛ, НФЛ, Еврокубки),
  // «Киберспорт» (Dota 2, League of Legends, CS2),
  // «Индивидуальные достижения» (Рекорды, Переходы игроков, Награды MVP).
  const sportsEvents = [
    {
      slug: "world-cup",
      title: "Чемпионат мира по футболу",
      titleEn: "FIFA World Cup",
      currentPrice: 62.4,
      vol: 0.02,
      seed: 501,
      photoKw: "football,world,cup,stadium",
      description:
        "Прогноз по чемпионату мира по футболу: фавориты турнира, шансы сборных на победу, выход из группы, сценарии плей-офф и влияние на букмекерские рынки. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "FIFA World Cup forecast: tournament favourites, national teams' chances of winning, group stage exits, playoff scenarios and the impact on betting markets. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "olympic-games",
      title: "Олимпийские игры",
      titleEn: "Olympic Games",
      currentPrice: 58.7,
      vol: 0.018,
      seed: 502,
      photoKw: "olympic,games,stadium,torch",
      description:
        "Прогноз по Олимпийским играм: медальный зачёт, шансы сборных и спортсменов, рекорды, посещаемость и влияние на экономику страны-хозяйки. ИИ-прогноз на выбранную дату с вероятностью направления и ключевыми сценариями.",
      descriptionEn:
        "Olympic Games forecast: medal table, chances of teams and athletes, records, attendance and the impact on the host country's economy. AI forecast for the chosen date with direction probability and key scenarios.",
    },
    {
      slug: "super-bowl",
      title: "Супербоул",
      titleEn: "Super Bowl",
      currentPrice: 55.2,
      vol: 0.025,
      seed: 503,
      photoKw: "superbowl,american,football,stadium",
      description:
        "Прогноз по Супербоулу: шансы команд на победу, тоталы, рекламный рынок, шоу в перерыве и рейтинги трансляции. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Super Bowl forecast: teams' chances of winning, totals, the advertising market, the halftime show and broadcast ratings. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "nba",
      title: "НБА",
      titleEn: "NBA",
      currentPrice: 51.9,
      vol: 0.02,
      seed: 504,
      photoKw: "nba,basketball,arena",
      description:
        "Прогноз по НБА: победитель сезона и плей-офф, лидеры конференций, статистика игроков, обмены и травмы. ИИ-прогноз на выбранную дату с вероятностью направления и ключевыми уровнями.",
      descriptionEn:
        "NBA forecast: season and playoff winner, conference leaders, player statistics, trades and injuries. AI forecast for the chosen date with direction probability and key levels.",
    },
    {
      slug: "premier-league",
      title: "АПЛ (Английская Премьер-лига)",
      titleEn: "Premier League",
      currentPrice: 53.6,
      vol: 0.02,
      seed: 505,
      photoKw: "premier,league,football,england",
      description:
        "Прогноз по Английской Премьер-лиге: чемпион, зоны Лиги чемпионов и вылета, топ-бомбардир, результаты туров. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Premier League forecast: champion, Champions League and relegation zones, top scorer, matchweek results. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "nfl",
      title: "НФЛ",
      titleEn: "NFL",
      currentPrice: 54.1,
      vol: 0.022,
      seed: 506,
      photoKw: "nfl,american,football,field",
      description:
        "Прогноз по НФЛ: победитель дивизионов и Супербоула, статистика команд, драфт, травмы ключевых игроков. ИИ-прогноз на выбранную дату с вероятностью направления и ключевыми сценариями.",
      descriptionEn:
        "NFL forecast: division and Super Bowl winner, team statistics, the draft, key player injuries. AI forecast for the chosen date with direction probability and key scenarios.",
    },
    {
      slug: "euro-cups",
      title: "Еврокубки (Лига чемпионов и Лига Европы)",
      titleEn: "European Cups (Champions League & Europa League)",
      currentPrice: 52.8,
      vol: 0.021,
      seed: 507,
      photoKw: "champions,league,football,europe",
      description:
        "Прогноз по еврокубкам: победитель Лиги чемпионов и Лиги Европы, выход из групп, жеребьёвки плей-офф, рейтинг лиг УЕФА. ИИ-прогноз на выбранную дату с графиком траектории.",
      descriptionEn:
        "European cups forecast: Champions League and Europa League winner, group stage exits, playoff draws, UEFA coefficient rankings. AI forecast for the chosen date with a trajectory chart.",
    },
    {
      slug: "dota-2",
      title: "Dota 2 (The International)",
      titleEn: "Dota 2 (The International)",
      currentPrice: 56.3,
      vol: 0.03,
      seed: 508,
      photoKw: "dota2,esports,cybersport,gaming",
      description:
        "Прогноз по киберспортивной дисциплине Dota 2: победитель The International и мейджоров, состав команд, мета и трансферы игроков. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "Dota 2 esports forecast: The International and majors winner, team rosters, meta and player transfers. AI forecast for the chosen date with direction probability.",
    },
    {
      slug: "league-of-legends",
      title: "League of Legends (Worlds)",
      titleEn: "League of Legends (Worlds)",
      currentPrice: 57.5,
      vol: 0.028,
      seed: 509,
      photoKw: "league,of,legends,esports",
      description:
        "Прогноз по League of Legends: победитель Worlds и региональных лиг, состав команд, мета-патчи и результаты плей-офф. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "League of Legends forecast: Worlds and regional leagues winner, team rosters, meta patches and playoff results. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "cs2",
      title: "CS2 (Counter-Strike 2)",
      titleEn: "CS2 (Counter-Strike 2)",
      currentPrice: 55.8,
      vol: 0.032,
      seed: 510,
      photoKw: "cs2,counter,strike,esports",
      description:
        "Прогноз по киберспортивной дисциплине CS2: победители мейджоров и топ-турниров, рейтинг команд HLTV, составы и переходы игроков. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "CS2 esports forecast: majors and top tournaments winners, HLTV team rankings, rosters and player transfers. AI forecast for the chosen date with direction probability.",
    },
    {
      slug: "sports-records",
      title: "Рекорды в спорте",
      titleEn: "Sports Records",
      currentPrice: 50.4,
      vol: 0.02,
      seed: 511,
      photoKw: "sports,record,trophy,athlete",
      description:
        "Прогноз по рекордам в спорте: мировые и олимпийские рекорды, рекорды результативности, достижения в лигах и турнирах. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "Sports records forecast: world and Olympic records, scoring records, achievements in leagues and tournaments. AI forecast for the chosen date with direction probability.",
    },
    {
      slug: "player-transfers",
      title: "Переходы игроков",
      titleEn: "Player Transfers",
      currentPrice: 51.2,
      vol: 0.024,
      seed: 512,
      photoKw: "football,transfer,player,contract",
      description:
        "Прогноз по переходам игроков: крупнейшие трансферы, суммы сделок, переходы свободных агентов и влияние на шансы команд. ИИ-прогноз на выбранную дату с графиком траектории.",
      descriptionEn:
        "Player transfers forecast: biggest transfers, deal values, free-agent moves and their impact on teams' chances. AI forecast for the chosen date with a trajectory chart.",
    },
    {
      slug: "mvp-awards",
      title: "Награды MVP",
      titleEn: "MVP Awards",
      currentPrice: 49.7,
      vol: 0.02,
      seed: 513,
      photoKw: "mvp,award,trophy,player",
      description:
        "Прогноз по наградам MVP: лауреаты в лигах (НБА, НФЛ, АПЛ и другие), статистика претендентов, голосование и сценарии. ИИ-прогноз на выбранную дату с вероятностью направления.",
      descriptionEn:
        "MVP awards forecast: winners in leagues (NBA, NFL, Premier League and others), candidates' statistics, voting and scenarios. AI forecast for the chosen date with direction probability.",
    },
  ];

  for (const s of sportsEvents) {
    const chartData = historyWalk(s.currentPrice, 40, s.vol, s.seed);
    await prisma.event.upsert({
      where: { slug: s.slug },
      update: {
        currentPrice: s.currentPrice,
        chartData,
      },
      create: {
        slug: s.slug,
        title: s.title,
        titleEn: s.titleEn,
        description: s.description,
        descriptionEn: s.descriptionEn,
        category: EventCategory.SPORTS,
        price: 10,
        currency: "EUR",
        currentPrice: s.currentPrice,
        chartData,
        imageUrl: `https://loremflickr.com/640/360/${encodeURIComponent(s.photoKw)}`,
      },
    });
  }

  // ---- Социальные тренды и общество (главное окно «Социальные тренды и общество»
  // на странице категории Общество) ----
  // Окна: «Демография: тренды рождаемости», «Демография: тренды миграции».
  const socialTrends = [
    {
      slug: "birth-trends",
      title: "Демография: тренды рождаемости",
      titleEn: "Demography: Birth Trends",
      currentPrice: 12.4,
      vol: 0.02,
      seed: 601,
      photoKw: "demography,population,birth,families",
      description:
        "Прогноз по мировым трендам рождаемости: коэффициент рождаемости по регионам, изменение числа новорождённых, демографическая политика государств и влияние на экономику и рынки. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Global birth rate trends forecast: regional fertility rates, changes in the number of newborns, government demographic policies and the impact on the economy and markets. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
    {
      slug: "migration-trends",
      title: "Демография: тренды миграции",
      titleEn: "Demography: Migration Trends",
      currentPrice: 18.6,
      vol: 0.022,
      seed: 602,
      photoKw: "migration,people,population,travel",
      description:
        "Прогноз по мировым трендам миграции: потоки трудовых мигрантов, движение беженцев, миграционная политика стран и влияние на демографию, рынок труда и экономику. ИИ-прогноз на выбранную дату с графиком траектории и вероятностью направления.",
      descriptionEn:
        "Global migration trends forecast: labor migration flows, refugee movements, national migration policies and their impact on demographics, the labor market and the economy. AI forecast for the chosen date with a trajectory chart and direction probability.",
    },
  ];

  for (const s of socialTrends) {
    const chartData = historyWalk(s.currentPrice, 40, s.vol, s.seed);
    await prisma.event.upsert({
      where: { slug: s.slug },
      update: {
        currentPrice: s.currentPrice,
        chartData,
      },
      create: {
        slug: s.slug,
        title: s.title,
        titleEn: s.titleEn,
        description: s.description,
        descriptionEn: s.descriptionEn,
        category: EventCategory.SOCIETY,
        price: 10,
        currency: "EUR",
        currentPrice: s.currentPrice,
        chartData,
        imageUrl: `https://loremflickr.com/640/360/${encodeURIComponent(s.photoKw)}`,
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
