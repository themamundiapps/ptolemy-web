"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PaywallModal from "@/components/PaywallModal";
import { useCheckout } from "@/lib/useCheckout";

interface Row {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const ROWS: Row[] = [
  { label: "AI consultations per day", free: "5", pro: "50" },
  { label: "Electional themes", free: "Love & Relationships, Travel", pro: "All 6 themes" },
  { label: "Temperament", free: "Full analysis + Health Tendencies", pro: "+ Traditional Recommendations" },
  { label: "Synastry", free: false, pro: true },
  { label: "Full natal Analysis", free: false, pro: true },
];

function Check() {
  return (
    <span aria-hidden className="text-bronze-dark">
      ✓
    </span>
  );
}

function Dash() {
  return (
    <span aria-hidden className="text-ink-2/50">
      —
    </span>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") return value ? <Check /> : <Dash />;
  return <span>{value}</span>;
}

function PricingPageInner() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("checkout") === "cancelled";
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { signedIn, loading, error, subscribe } = useCheckout();

  return (
    <div className="min-h-screen bg-parchment">
      <Nav onSignInClick={() => setPaywallOpen(true)} />

      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <div className="text-center">
          <h1 className="font-cinzel text-3xl font-semibold uppercase tracking-[0.04em] text-ink sm:text-4xl">
            Simple pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-cormorant text-lg text-ink-2">
            One free plan, one Pro plan. No tiers to compare, no annual discount to think about — $5 a month for the
            full traditional toolkit.
          </p>
        </div>

        {cancelled && (
          <p className="mx-auto mt-8 max-w-md border border-line bg-parchment-2 px-4 py-3 text-center font-cormorant text-sm text-ink-2">
            Checkout was cancelled — no charge was made.
          </p>
        )}

        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-line pb-4 font-cormorant text-base font-normal text-ink-2">Feature</th>
                <th className="border-b border-line pb-4 text-center font-cinzel text-sm uppercase tracking-[0.06em] text-ink">
                  Free
                </th>
                <th className="border-b border-b-bronze pb-4 text-center font-cinzel text-sm uppercase tracking-[0.06em] text-bronze-dark">
                  Ptolemy Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="border-b border-line py-4 pr-4 font-cormorant text-ink-2">{row.label}</td>
                  <td className="border-b border-line py-4 text-center font-cormorant text-ink">
                    <Cell value={row.free} />
                  </td>
                  <td className="border-b border-line py-4 text-center font-cormorant text-ink">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-6" />
                <td className="py-6 text-center font-cinzel text-2xl text-ink">$0</td>
                <td className="py-6 text-center">
                  <span className="font-cinzel text-2xl text-bronze-dark">$5</span>
                  <span className="font-cormorant text-ink-2"> /month</span>
                </td>
              </tr>
              <tr>
                <td />
                <td className="pb-2 text-center font-cormorant text-sm text-ink-2">Current plan for guests</td>
                <td className="pb-2 text-center">
                  <button
                    type="button"
                    onClick={subscribe}
                    disabled={loading}
                    className="border border-ink bg-ink px-6 py-2 font-cinzel text-xs tracking-[0.08em] text-parchment transition-colors hover:bg-ink-2 disabled:opacity-60"
                  >
                    {loading ? "Redirecting…" : signedIn ? "Subscribe" : "Sign in to subscribe"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className="mt-6 text-center font-cormorant text-sm text-terracotta">{error}</p>}

        <p className="mt-12 text-center font-cormorant text-sm text-ink-2">
          Billed monthly in USD, cancel anytime from your{" "}
          <a href="/account" className="underline hover:text-ink">
            account page
          </a>
          .
        </p>
      </main>

      <Footer />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageInner />
    </Suspense>
  );
}
