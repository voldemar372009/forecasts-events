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
