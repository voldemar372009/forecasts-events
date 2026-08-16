export const CATEGORIES = ["GOLD", "OIL", "CURRENCY", "CRYPTO", "RATES", "OTHER"] as const;
export type CategoryId = (typeof CATEGORIES)[number];

const categoryColors: Record<CategoryId, { c1: string; c2: string; icon: string }> = {
  GOLD: { c1: "#F59E0B", c2: "#B45309", icon: "Au" },
  OIL: { c1: "#1E40AF", c2: "#0B1120", icon: "Oil" },
  CURRENCY: { c1: "#2563EB", c2: "#1E40AF", icon: "€/$" },
  CRYPTO: { c1: "#F59E0B", c2: "#7C2D12", icon: "₿" },
  RATES: { c1: "#0EA5E9", c2: "#1E40AF", icon: "%" },
  OTHER: { c1: "#10B981", c2: "#1E40AF", icon: "?" },
};

export function categoryImage(category: string, label?: string): string {
  const conf = categoryColors[category as CategoryId] ?? categoryColors.OTHER;
  const text = (label || conf.icon).slice(0, 12).replace(/&/g, "&amp;");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${conf.c1}'/><stop offset='1' stop-color='${conf.c2}'/></linearGradient></defs><rect width='800' height='450' fill='url(#g)'/><text x='400' y='245' font-family='Arial, sans-serif' font-size='88' font-weight='bold' fill='rgba(255,255,255,0.95)' text-anchor='middle'>${text}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const photoKeywords: Record<CategoryId, string> = {
  GOLD: "gold,ingot",
  OIL: "oil,petroleum",
  CURRENCY: "currency,money",
  CRYPTO: "bitcoin,crypto",
  RATES: "interest,chart",
  OTHER: "stock,market",
};

/** Реальное фото по категории (бесплатный LoremFlickr по ключевым словам). */
export function categoryPhoto(category: string): string {
  const kw = photoKeywords[category as CategoryId] ?? "stock,market";
  return `https://loremflickr.com/640/360/${encodeURIComponent(kw)}`;
}

/** Картинка для отображения: реальный URL админа > фото категории > SVG-заглушка. */
export function resolveEventImage(imageUrl: string | null, category: string): string {
  if (imageUrl && imageUrl.startsWith("http")) return imageUrl;
  return categoryPhoto(category);
}

// Ключевые слова для автоопределения категории по названию рынка/события.
// Короткие ключи (<=3 симв.) сравниваются по целым токенам, длинные — подстрокой.
const keywordMap: Record<CategoryId, string[]> = {
  CRYPTO: [
    "btc", "bitcoin", "биткоин", "eth", "ethereum", "эфир", "эфириум", "solana", "sol",
    "xrp", "ton", "bnb", "doge", "dogecoin", "ltc", "litecoin", "ada", "cardano",
    "крипт", "монет", "токен",
  ],
  CURRENCY: [
    "usdt", "usdc", "eur", "usd", "rub", "gbp", "jpy", "chf", "cad", "aud", "nzd",
    "cny", "uah", "kzt", "try", "inr", "доллар", "евро", "рубль", "юань", "валюта",
    "курс", "форекс", "forex", "stablecoin", "стейблкоин",
  ],
  GOLD: [
    "gold", "золото", "xau", "silver", "серебро", "xag", "platinum", "платина",
    "palladium", "палладий", "драгметалл",
  ],
  OIL: ["oil", "нефть", "brent", "wti", "бензин", "газойль"],
  RATES: ["rate", "ставка", "fed", "фрс", "ecb", "ецб", "fomc", "ипотека", "процент"],
  OTHER: [],
};

const detectOrder: CategoryId[] = ["CRYPTO", "CURRENCY", "GOLD", "OIL", "RATES"];

export function detectCategory(title: string): CategoryId | null {
  const t = title.toLowerCase().trim();
  if (!t) return null;
  const tokens = t.split(/[^a-zа-я0-9]+/).filter(Boolean);
  for (const cat of detectOrder) {
    for (const kw of keywordMap[cat]) {
      if (kw.length >= 4) {
        if (t.includes(kw)) return cat;
      } else if (tokens.includes(kw)) {
        return cat;
      }
    }
  }
  return null;
}
