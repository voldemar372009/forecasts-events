import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/data";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const localeParam = req.nextUrl.searchParams.get("locale") || "ru";
  const locale = isLocale(localeParam) ? localeParam : "ru";
  const event = await getEventBySlug(params.slug, locale);
  if (!event) return NextResponse.json({ error: "notFound" }, { status: 404 });
  return NextResponse.json({ event });
}
