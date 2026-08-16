import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/data";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const localeParam = req.nextUrl.searchParams.get("locale") || "ru";
  const locale = isLocale(localeParam) ? localeParam : "ru";
  const events = await getEvents(locale);
  return NextResponse.json({ events });
}
