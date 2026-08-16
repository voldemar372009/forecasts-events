import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { generateForecast } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "stripe not configured" }, { status: 500 });
  }

  const raw = await req.text();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string };
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
      include: { forecast: true },
    });
    if (payment && payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" },
      });
      if (payment.forecastId) {
        void generateForecast(payment.forecastId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
