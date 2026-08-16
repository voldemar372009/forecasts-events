import Stripe from "stripe";

let _stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (_stripe === undefined) {
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function amountInCents(amount: number): number {
  return Math.round(amount * 100);
}
