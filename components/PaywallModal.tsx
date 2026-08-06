"use client";

import Link from "next/link";
import PricingCard from "./PricingCard";
import GoogleSignInButton from "./GoogleSignInButton";
import { useCheckout } from "@/lib/useCheckout";

// The one Pro plan there is -- $5/month, no annual tier (product decision).
// A single plan means no "Most popular" badge either: that only makes
// sense as a comparison between paid options, and there isn't one.
const PRO_FEATURES = [
  "50 AI consultations a day (vs. 5 free)",
  "All 6 Electional themes",
  "Full Temperament, including Traditional Recommendations",
  "Synastry",
  "Full natal Analysis",
];

export default function PaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signedIn, loading, error, subscribe } = useCheckout();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-ink bg-parchment p-8"
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

        <div className="mt-8">
          <PricingCard
            title="Ptolemy Pro"
            price="$5"
            period="month"
            features={PRO_FEATURES}
            onSelect={subscribe}
            ctaLabel={loading ? "Redirecting…" : signedIn ? "Subscribe" : "Sign in to subscribe"}
          />
        </div>
        {error && <p className="mt-4 text-center font-cormorant text-sm text-terracotta">{error}</p>}
        <p className="mt-6 text-center font-cormorant text-sm text-ink-2">
          <Link href="/pricing" className="underline hover:text-ink" onClick={onClose}>
            See the full free vs. Pro comparison
          </Link>
        </p>
      </div>
    </div>
  );
}
