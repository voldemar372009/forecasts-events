import { NextRequest, NextResponse } from "next/server";
import { getMarketQuote } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const title = String(req.nextUrl.searchParams.get("title") || "").trim();
  if (title.length < 2) return NextResponse.json({ quote: null });
  const quote = await getMarketQuote(title);
  return NextResponse.json({ quote });
}
