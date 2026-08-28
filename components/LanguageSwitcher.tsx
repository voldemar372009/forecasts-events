"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/constants";
import { locales } from "@/lib/i18n";

const LABELS: Record<string, string> = {
  ru: "RU",
  en: "EN",
  es: "ES",
  it: "IT",
  fr: "FR",
  de: "DE",
};

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (l: string) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000`;
    if (locale === l) return;
    const parts = pathname.split("/");
    if ((locales as readonly string[]).includes(parts[1])) parts[1] = l;
    else parts.splice(1, 0, l);
    router.replace(parts.join("/") || "/");
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-night-line bg-night-light/60 p-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`rounded-full px-2.5 py-1 text-sm font-semibold transition-colors ${
            locale === l ? "bg-primary text-white shadow-neonSm" : "text-white/60 hover:text-white"
          }`}
        >
          {LABELS[l] || l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
