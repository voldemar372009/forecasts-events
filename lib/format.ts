import type { Locale } from "./i18n";

export function fmtMoney(
  amount: number | string | { toString(): string },
  currency = "EUR",
  locale: Locale = "ru"
): string {
  const n = typeof amount === "object" ? Number(amount.toString()) : Number(amount);
  try {
    return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
}

export function fmtNumber(n: number | string | { toString(): string }, digits = 2): string {
  const v = typeof n === "object" ? Number(n.toString()) : Number(n);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(v);
}

export function fmtDate(d: Date | string, locale: Locale = "ru"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** value for <input type="date"> (yyyy-mm-dd) */
export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayInput(): string {
  return toDateInput(new Date());
}

export function maxDateInput(): string {
  // Без ограничений по году — разрешаем сколь угодно дальние даты.
  return "9999-12-31";
}
