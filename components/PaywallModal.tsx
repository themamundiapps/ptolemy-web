"use client";

import { useState } from "react";
import PricingCard from "./PricingCard";
import GoogleSignInButton from "./GoogleSignInButton";
import { getStripe } from "@/lib/stripe";

export default function PaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [comingSoon, setComingSoon] = useState(false);

  if (!open) return null;

  const handleSubscribe = async () => {
    // Real checkout (Stripe Checkout session redirect) lands here once
    // billing is live -- getStripe() already resolves against the real
    // publishable key when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.
    await getStripe();
    setComingSoon(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-ink bg-parchment p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-cinzel text-2xl font-semibold text-ink">Upgrade to Ptolemy Pro</h2>
          <button onClick={onClose} className="font-cormorant text-2xl leading-none text-ink-2 hover:text-ink">
            &times;
          </button>
        </div>
        <p className="mt-2 font-cormorant text-ink-2">
          Unlimited guidance from the astrologer, plus the full traditional toolkit.
        </p>

        <div className="mt-6 flex items-center justify-center border border-line bg-parchment-2 px-4 py-3">
          <GoogleSignInButton />
        </div>

        {comingSoon ? (
          <div className="mt-8 border border-bronze bg-parchment-2 p-6 text-center">
            <p className="font-cinzel text-xl text-ink">Coming soon — launching shortly.</p>
            <p className="mt-2 font-cormorant text-sm text-ink-2">
              We&apos;re finishing up billing. Check back soon to subscribe to Ptolemy Pro.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <PricingCard
              title="Pro — Monthly"
              price="$4.99"
              period="month"
              features={[
                "Unlimited chat with the astrologer",
                "Full natal chart reading",
                "Electional astrology",
                "Synastry",
                "Temperament analysis",
                "Daily transits",
              ]}
              onSelect={handleSubscribe}
            />
            <PricingCard
              title="Pro — Yearly"
              price="$19.99"
              period="year"
              badge="Best value"
              highlighted
              features={[
                "Everything in Monthly",
                "Two months free vs. paying monthly",
              ]}
              onSelect={handleSubscribe}
            />
          </div>
        )}
      </div>
    </div>
  );
}
