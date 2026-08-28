import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";
import { SESSION_COOKIE, LOCALE_COOKIE } from "@/lib/constants";

function getLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie as Locale;
  const accept = req.headers.get("accept-language") || "";
  const pref = accept.toLowerCase().split(",")[0].split("-")[0].split("_")[0] as Locale;
  if ((locales as readonly string[]).includes(pref)) return pref;
  return defaultLocale;
}

async function verifyToken(token: string): Promise<{ id: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
    const { payload } = await jwtVerify(token, secret);
    return { id: (payload.sub as string) || "", role: ((payload.role as string) || "USER") };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = getLocale(req);

  const hasLocale =
    pathname === `/${locales[0]}` ||
    pathname.startsWith(`/${locales[0]}/`) ||
    (locales as readonly string[]).some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (!hasLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  const parts = pathname.split("/"); // ["", locale, ...rest]
  const pathLocale = parts[1];
  const restPath = parts.slice(2).join("/");

  const isProtected = restPath === "dashboard" || restPath.startsWith("dashboard/");
  const isAdmin = restPath === "admin" || restPath.startsWith("admin/");

  if (isProtected && !user) {
    return NextResponse.redirect(new URL(`/${pathLocale}/auth/login`, req.url));
  }
  if (isAdmin) {
    if (!user) return NextResponse.redirect(new URL(`/${pathLocale}/auth/login`, req.url));
    if (user.role !== "ADMIN") return NextResponse.redirect(new URL(`/${pathLocale}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
