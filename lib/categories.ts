export const CATEGORIES = [
  "GOLD",
  "OIL",
  "CURRENCY",
  "CRYPTO",
  "RATES",
  "OTHER",
  "ECONOMICS",
  "POLITICS",
  "SPORTS",
  "CLIMATE",
  "SOCIETY",
  "HEALTH",
] as const;
export type CategoryId = (typeof CATEGORIES)[number];

// Категории, показываемые отдельным пунктом в боковом меню.
export const SIDEBAR_CATEGORIES: CategoryId[] = [
  "ECONOMICS",
  "POLITICS",
  "SPORTS",
  "CLIMATE",
  "SOCIETY",
  "HEALTH",
];

const categoryColors: Record<CategoryId, { c1: string; c2: string; icon: string }> = {
  GOLD: { c1: "#F59E0B", c2: "#B45309", icon: "Au" },
  OIL: { c1: "#1E40AF", c2: "#0B1120", icon: "Oil" },
  CURRENCY: { c1: "#2563EB", c2: "#1E40AF", icon: "€/$" },
  CRYPTO: { c1: "#F59E0B", c2: "#7C2D12", icon: "₿" },
  RATES: { c1: "#0EA5E9", c2: "#1E40AF", icon: "%" },
  OTHER: { c1: "#10B981", c2: "#1E40AF", icon: "?" },
  ECONOMICS: { c1: "#FBBF24", c2: "#92400E", icon: "Eco" },
  POLITICS: { c1: "#6366F1", c2: "#312E81", icon: "Pol" },
  SPORTS: { c1: "#22C55E", c2: "#14532D", icon: "Spr" },
  CLIMATE: { c1: "#0EA5E9", c2: "#0C4A6E", icon: "Clm" },
  SOCIETY: { c1: "#EC4899", c2: "#831843", icon: "Soc" },
  HEALTH: { c1: "#A855F7", c2: "#581C87", icon: "Hl" },
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
  ECONOMICS: "economy,finance,gdp",
  POLITICS: "politics,government",
  SPORTS: "sports,stadium,football",
  CLIMATE: "climate,nature,weather",
  SOCIETY: "society,people,community",
  HEALTH: "health,science,medicine",
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
  ECONOMICS: [
    "экономик", "экономика", "ввп", "gdp", "инфляци", "безработиц", "валюта курс",
    "санкци", "econ", "economy", "inflation", "recession", "gdp",
  ],
  POLITICS: [
    "политик", "выбор", "президент", "полит", "government", "election", "parliament",
    "санкции", "санкци", "лидер", "голосован",
  ],
  SPORTS: [
    "спорт", "футбол", "football", "soccer", "чемпионат", "олимпиад", "теннис",
    "хоккей", "hockey", "баскетбол", "basketball", "world cup", "ст", "league",
  ],
  CLIMATE: [
    "климат", "эколог", "погод", "наводнен", "засух", "температур", "экологи",
    "climate", "environment", "weather", "warming", "парник",
  ],
  SOCIETY: [
    "социальн", "общество", "тренд", "демографи", "миграци", "мода", "население",
    "society", "social", "trend", "demographic", "милли", "людей",
  ],
  HEALTH: [
    "здоров", "медицин", "наук", "вакцин", "science", "medicine", "health",
    "healthcare", "исследован", "открыти", "лекарств",
  ],
  OTHER: [],
};

const detectOrder: CategoryId[] = [
  "CRYPTO",
  "CURRENCY",
  "GOLD",
  "OIL",
  "RATES",
  "ECONOMICS",
  "POLITICS",
  "SPORTS",
  "CLIMATE",
  "SOCIETY",
  "HEALTH",
];

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
