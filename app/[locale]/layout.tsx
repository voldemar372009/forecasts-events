import Link from "next/link";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { SIDEBAR_CATEGORIES } from "@/lib/categories";
import Sidebar, { type CategoryNavItem, LogoMark } from "@/components/Sidebar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";

const CATEGORY_ICONS: Record<string, string> = {
  ECONOMICS: "📈",
  POLITICS: "🏛️",
  SPORTS: "⚽",
  CLIMATE: "🌍",
  SOCIETY: "👥",
  HEALTH: "🧬",
  CULTURE: "🎬",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const user = await getSessionUser();

  const categoryNav: CategoryNavItem[] = SIDEBAR_CATEGORIES.map((c) => ({
    id: c,
    label: dict.category[c],
    icon: CATEGORY_ICONS[c] ?? "",
  }));

  return (
    <div className="flex min-h-screen flex-col bg-grid bg-[length:28px_28px]">
      {/* Боковая панель (десктоп) */}
      <Sidebar
        locale={locale}
        user={user ? { name: user.name, role: user.role } : null}
        dict={{
          brand: dict.nav.brand,
          markets: dict.nav.markets,
          newForecast: dict.nav.newForecast,
          dashboard: dict.nav.dashboard,
          analytics: dict.nav.analytics,
          admin: dict.nav.admin,
          login: dict.nav.login,
          logout: dict.nav.logout,
          live: dict.events.live,
        }}
        categoryNav={categoryNav}
      />

      {/* Верхняя панель (мобильные) */}
      <div className="glass sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-bold text-white">{dict.nav.brand}</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <LogoutButton locale={locale} label={dict.nav.logout} />
          ) : (
            <Link href={`/${locale}/auth/login`} className="btn-ghost !px-3 !py-1.5 text-xs">
              {dict.nav.login}
            </Link>
          )}
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
      {/* Мобильное меню (прокрутка) */}
      <nav className="sticky top-[61px] z-10 flex gap-2 overflow-x-auto border-b border-night-line bg-[#0A0C10]/90 px-4 py-2 backdrop-blur lg:hidden">
        {[
          { href: `/${locale}`, label: dict.nav.markets },
          ...categoryNav.map((c) => ({
            href: `/${locale}/${c.id.toLowerCase()}`,
            label: `${c.icon} ${c.label}`,
          })),
          { href: `/${locale}#custom-forecast`, label: dict.nav.newForecast },
          { href: `/${locale}/dashboard`, label: dict.nav.dashboard },
          { href: `/${locale}/leaderboard`, label: dict.nav.analytics },
          ...(user?.role === "ADMIN" ? [{ href: `/${locale}/admin`, label: dict.nav.admin }] : []),
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-full border border-night-line bg-night-card px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-night-line py-6">
          <p className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-white/40">
            {dict.hero.disclaimerExtra}
          </p>
          <p className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-white/40">
            © {new Date().getFullYear()} {dict.nav.brand} · {dict.hero.disclaimer}
          </p>
        </footer>
      </div>
    </div>
  );
}
