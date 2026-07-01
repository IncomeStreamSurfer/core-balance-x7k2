import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client. Server-only. */
export function stripe(): Stripe {
  if (!_stripe) {
    const key = import.meta.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
