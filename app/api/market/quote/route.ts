import { NextRequest, NextResponse } from "next/server";
import { getMarketQuote } from "@/lib/market";
import { analyzeHistory, type TechAnalysis } from "@/lib/technical";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const title = String(req.nextUrl.searchParams.get("title") || "").trim();
  if (title.length < 2) return NextResponse.json({ quote: null });
  const quote = await getMarketQuote(title);
  if (!quote || !(quote.price > 0)) return NextResponse.json({ quote: null });

  let analysis: TechAnalysis | null = null;
  if (quote.history && quote.history.length > 1) {
    analysis = analyzeHistory(quote.history, title, quote.price);
  }

  return NextResponse.json({ quote: { ...quote, analysis } });
}
