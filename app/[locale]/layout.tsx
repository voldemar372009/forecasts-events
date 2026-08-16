import Link from "next/link";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";

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

  return (
    <div className="flex min-h-screen flex-col bg-grid bg-[length:28px_28px]">
      <header className="glass sticky top-0 z-20 border-b border-night-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={`/${locale}`} className="text-xl font-bold tracking-tight">
            <span className="neon-text">{dict.nav.brand}</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href={`/${locale}`} className="hidden text-sm font-medium text-white/70 hover:text-accent sm:block">
              {dict.nav.home}
            </Link>
            <Link href={`/${locale}/leaderboard`} className="hidden text-sm font-medium text-white/70 hover:text-accent sm:block">
              {dict.nav.leaderboard}
            </Link>
            {user && (
              <Link href={`/${locale}/dashboard`} className="text-sm font-medium text-white/70 hover:text-accent">
                {dict.nav.dashboard}
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href={`/${locale}/admin`} className="text-sm font-medium text-accent-light hover:text-accent">
                {dict.nav.admin}
              </Link>
            )}
            <LanguageSwitcher locale={locale} />
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-white md:block">
                  {user.name}
                </span>
                <LogoutButton locale={locale} label={dict.nav.logout} />
              </div>
            ) : (
              <Link href={`/${locale}/auth/login`} className="btn-ghost !px-4 !py-2 text-sm">
                {dict.nav.login}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-night-line py-6">
        <p className="mx-auto max-w-3xl px-4 text-center text-xs leading-relaxed text-white/40">
          © {new Date().getFullYear()} {dict.nav.brand} · {dict.hero.disclaimer}
        </p>
      </footer>
    </div>
  );
}
