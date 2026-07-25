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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/10 bg-background p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-serif text-3xl text-gold">Upgrade to Ptolemy Pro</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted hover:text-ink">
            &times;
          </button>
        </div>
        <p className="mt-2 text-muted">Unlimited guidance from the astrologer, plus the full traditional toolkit.</p>

        <div className="mt-6 flex items-center justify-center rounded border border-white/10 bg-surface/60 px-4 py-3">
          <GoogleSignInButton />
        </div>

        {comingSoon ? (
          <div className="mt-8 rounded border border-gold/40 bg-surface p-6 text-center">
            <p className="font-serif text-xl text-gold">Coming soon — launching shortly.</p>
            <p className="mt-2 text-sm text-muted">
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
