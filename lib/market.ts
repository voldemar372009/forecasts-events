// lib/market.ts — реальные рыночные данные из бесплатных API (без ключей):
//   криптовалюты: Binance (ticker + дневные свечи)
//   валюты:       open.er-api.com (161 валюта, включая RUB)
//   золото/нефть: пока не подключены (нужен бесплатный ключ Alpha Vantage)

export type MarketQuote = {
  price: number;
  currency: string;
  source: string;
  symbol: string;
  history: { t: string; v: number }[] | null;
};

const cryptoSymbols: Record<string, string> = {
  btc: "BTC", bitcoin: "BTC", биткоин: "BTC",
  eth: "ETH", ethereum: "ETH", эфир: "ETH", эфириум: "ETH",
  sol: "SOL", solana: "SOL",
  xrp: "XRP", ton: "TON", bnb: "BNB", doge: "DOGE", dogecoin: "DOGE",
  ltc: "LTC", litecoin: "LTC", ada: "ADA", cardano: "ADA",
  trx: "TRX", tron: "TRX", avax: "AVAX", link: "LINK", dot: "DOT",
  usdt: "USDT", usdc: "USDC",
};

const stableCoins = new Set(["USDT", "USDC", "DAI", "BUSD", "FDUSD"]);

const fxCodes: Record<string, string> = {
  usd: "USD", доллар: "USD", бакс: "USD", долларов: "USD",
  eur: "EUR", евро: "EUR",
  rub: "RUB", рубль: "RUB", руб: "RUB", рубля: "RUB", рублей: "RUB",
  gbp: "GBP", фунт: "GBP",
  jpy: "JPY", иена: "JPY", йена: "JPY",
  chf: "CHF", франк: "CHF",
  cad: "CAD", aud: "AUD", nzd: "NZD",
  cny: "CNY", юань: "CNY",
  uah: "UAH", гривна: "UAH",
  kzt: "KZT", тенге: "KZT",
  try: "TRY", лира: "TRY",
  inr: "INR", brl: "BRL", mxn: "MXN", sek: "SEK", nok: "NOK",
  dkk: "DKK", pln: "PLN", czk: "CZK", huf: "HUF", zar: "ZAR",
};

function tokensOf(title: string): string[] {
  return title.toLowerCase().split(/[^a-zа-я0-9]+/).filter(Boolean);
}

export function parseSymbol(
  title: string
): { kind: "crypto"; symbol: string } | { kind: "fx"; from: string; to: string } | null {
  const toks = tokensOf(title);
  // 1) криптовалюты: известные имена/тикеры
  for (const t of toks) {
    const s = cryptoSymbols[t];
    if (s) return { kind: "crypto", symbol: s };
  }
  // 2) валюты: две кодовые валюты в названии -> пара "из/в"
  const found: string[] = [];
  for (const t of toks) {
    const code = fxCodes[t];
    if (code && !found.includes(code)) found.push(code);
  }
  if (found.length >= 2) return { kind: "fx", from: found[0], to: found[1] };
  if (found.length === 1) {
    const c = found[0];
    // одна валюта: «доллар» -> EUR/USD, «рубль» -> USD/RUB, «евро» -> USD/EUR
    if (c === "USD") return { kind: "fx", from: "EUR", to: "USD" };
    if (c === "EUR") return { kind: "fx", from: "USD", to: "EUR" };
    return { kind: "fx", from: "USD", to: c };
  }
  return null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getMarketQuote(title: string): Promise<MarketQuote | null> {
  const parsed = parseSymbol(title);
  if (!parsed) return null;

  if (parsed.kind === "crypto") {
    if (stableCoins.has(parsed.symbol)) {
      return { price: 1, currency: "USD", source: "Binance", symbol: parsed.symbol, history: null };
    }
    const ticker = (await fetchJson(
      `https://api.binance.com/api/v3/ticker/price?symbol=${parsed.symbol}USDT`
    )) as { price?: string } | null;
    if (!ticker || !ticker.price) return null;
    const price = Number(ticker.price);
    const klines = (await fetchJson(
      `https://api.binance.com/api/v3/klines?symbol=${parsed.symbol}USDT&interval=1d&limit=45`
    )) as unknown[] | null;
    const history = Array.isArray(klines)
      ? klines
          .map((k) => {
            const row = k as number[];
            return {
              t: new Date(row[0]).toISOString().slice(0, 10),
              v: Math.round(Number(row[4]) * 100) / 100,
            };
          })
          .filter((p) => p.v > 0)
      : null;
    return { price, currency: "USD", source: "Binance", symbol: `${parsed.symbol}/USDT`, history };
  }

  // валюты
  const data = (await fetchJson(
    `https://open.er-api.com/v6/latest/${parsed.from}`
  )) as { result?: string; rates?: Record<string, number> } | null;
  if (!data || data.result !== "success" || !data.rates) return null;
  const rate = Number(data.rates[parsed.to]);
  if (!(rate > 0)) return null;
  return {
    price: Math.round(rate * 10000) / 10000,
    currency: parsed.to,
    source: "open.er-api.com",
    symbol: `${parsed.from}/${parsed.to}`,
    history: null,
  };
}
