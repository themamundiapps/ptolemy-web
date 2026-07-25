import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/** Loads Stripe.js against the publishable key once checkout is wired up.
 * Until NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set, this resolves to null and
 * callers should fall back to the "coming soon" placeholder. */
export function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}
