"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/constants";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (l: "ru" | "en") => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000`;
    if (locale === l) return;
    const parts = pathname.split("/");
    if (parts[1] === "ru" || parts[1] === "en") parts[1] = l;
    else parts.splice(1, 0, l);
    router.replace(parts.join("/") || "/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-night-line bg-night-light/60 p-1">
      <button
        onClick={() => switchTo("ru")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
          locale === "ru" ? "bg-primary text-white shadow-neonSm" : "text-white/60 hover:text-white"
        }`}
      >
        RU
      </button>
      <button
        onClick={() => switchTo("en")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
          locale === "en" ? "bg-primary text-white shadow-neonSm" : "text-white/60 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
