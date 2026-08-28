"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";

type SidebarDict = {
  brand: string;
  markets: string;
  newForecast: string;
  dashboard: string;
  analytics: string;
  admin: string;
  login: string;
  logout: string;
  live: string;
};

export type CategoryNavItem = {
  id: string;
  label: string;
  icon: string;
};

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-xl shadow-glowAccent"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 55%, #D97706 100%)",
      }}
    >
      {/* Фирменный знак «Прогноз AI»: история цены + пунктирная проекция + целевая точка */}
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 32 32"
        fill="none"
        stroke="#1A1206"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 24 L10 17 L14 20 L19 12" />
        <path d="M19 12 L25 7" strokeDasharray="2.5 2.5" />
        <circle cx="25" cy="7" r="2.2" fill="#1A1206" stroke="none" />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/15" />
    </div>
  );
}

export default function Sidebar({
  locale,
  dict,
  user,
  categoryNav,
}: {
  locale: string;
  dict: SidebarDict;
  user: { name: string; role: string } | null;
  categoryNav: CategoryNavItem[];
}) {
  const pathname = usePathname();
  const base = `/${locale}`;

  const items: { href: string; label: string; icon: string; markets?: boolean }[] = [
    { href: base, label: dict.markets, icon: "📊", markets: true },
    ...categoryNav.map((c) => ({
      href: `${base}/category/${c.id}`,
      label: c.label,
      icon: c.icon,
    })),
    { href: `${base}#custom-forecast`, label: dict.newForecast, icon: "➕" },
    { href: `${base}/dashboard`, label: dict.dashboard, icon: "👤" },
    { href: `${base}/leaderboard`, label: dict.analytics, icon: "🏆" },
  ];
  if (user?.role === "ADMIN") items.push({ href: `${base}/admin`, label: dict.admin, icon: "⚙️" });

  const isActive = (href: string, markets?: boolean) => {
    if (markets) return pathname === base || pathname.startsWith(`${base}/events`);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-night-line bg-[#0A0C10]/95 backdrop-blur lg:flex">
      {/* Логотип */}
      <div className="flex items-center gap-3 px-5 py-5">
        <LogoMark />
        <span className="text-lg font-bold tracking-tight text-white">
          {dict.brand.split(" ")[0]}{" "}
          <span className="neon-text">{dict.brand.split(" ").slice(1).join(" ") || "AI"}</span>
        </span>
      </div>

      {/* Меню */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = isActive(item.href, item.markets);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-night-card font-semibold text-white"
                  : "font-medium text-white/60 hover:bg-night-card/60 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-accent shadow-glowAccent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Низ панели */}
      <div className="space-y-3 border-t border-night-line p-4">
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">{dict.live}</span>
        </div>
        <LanguageSwitcher locale={locale} />
        {user ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="truncate text-sm font-semibold text-white">{user.name}</span>
            <LogoutButton locale={locale} label={dict.logout} />
          </div>
        ) : (
          <Link href={`${base}/auth/login`} className="btn-primary w-full !py-2 text-sm">
            {dict.login}
          </Link>
        )}
      </div>
    </aside>
  );
}
