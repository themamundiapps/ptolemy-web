"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { ApiError, createCheckoutSession } from "@/lib/api";

/** Shared "Subscribe to Pro" behavior for the paywall modal and the pricing
 * page: sign in first if needed, otherwise create a hosted Stripe Checkout
 * session and redirect the browser to it. No card data is ever handled
 * here or anywhere else in this app -- Stripe's own page collects it. */
export function useCheckout() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = status === "authenticated" && !!session?.user;

  const subscribe = async () => {
    if (!signedIn) {
      signIn("google");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return { signedIn, loading, error, subscribe };
}
