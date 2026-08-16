import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { next?: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const next = typeof searchParams?.next === "string" ? searchParams.next : undefined;

  return (
    <div className="fade-in flex items-center justify-center py-10">
      <AuthForm mode="login" locale={locale} dict={dict.auth} next={next} />
    </div>
  );
}
