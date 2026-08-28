import { NextResponse } from "next/server";
import { getRatesSummary } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getRatesSummary();
  return NextResponse.json({ rates });
}