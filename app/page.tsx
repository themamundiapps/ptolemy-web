"use client";

import Link from "next/link";
import { useState } from "react";
import FeatureCard from "@/components/FeatureCard";
import PricingCard from "@/components/PricingCard";
import PaywallModal from "@/components/PaywallModal";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    title: "Natal Chart",
    description: "Your planets, dignities, and house lords interpreted from classical sources.",
  },
  {
    title: "Electional Astrology",
    description: "Find the most favorable moment to act, using a traditional checklist method.",
  },
  {
    title: "Synastry",
    description: "Compare two charts in the Hellenistic tradition.",
  },
];

const STEPS = ["Enter your birth data", "Ask the astrologer", "Receive a traditional reading"];

export default function LandingPage() {
  const [paywallOpen, setPaywallOpen] = useState(false);

  return (
    <main>
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-5xl font-medium text-ink sm:text-6xl md:text-7xl">
          Traditional Astrology. <span className="text-gold">Ancient Wisdom.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          Your natal chart read through the methods of Claudius Ptolemy and Vettius Valens — not
          pop astrology. The real tradition.
        </p>
        <Link
          href="/chart"
          className="mt-10 rounded bg-gold px-8 py-3 font-medium text-background transition-transform hover:scale-105"
        >
          Begin with your birth chart
        </Link>
        <Link href="/chart?example=1" className="mt-4 text-sm text-muted underline hover:text-gold">
          See example reading
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-surface/40 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-serif text-3xl text-ink">How it works</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold font-serif text-xl text-gold">
                  {i + 1}
                </div>
                <p className="mt-4 text-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center font-serif text-3xl text-ink">Pricing</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <PricingCard
            title="Free"
            price="$0"
            features={["5 chart readings", "Basic natal chart", "Chat with 5 messages"]}
          />
          <PricingCard
            title="Pro — Monthly"
            price="$4.99"
            period="month"
            features={[
              "Unlimited chat",
              "Full natal chart",
              "Electional astrology",
              "Synastry",
              "Temperament",
              "Daily transits",
            ]}
            onSelect={() => setPaywallOpen(true)}
          />
          <PricingCard
            title="Pro — Yearly"
            price="$19.99"
            period="year"
            badge="Best value"
            highlighted
            features={[
              "Everything in Monthly",
              "Full natal chart",
              "Electional astrology",
              "Synastry",
              "Temperament",
              "Daily transits",
            ]}
            onSelect={() => setPaywallOpen(true)}
          />
        </div>
      </section>

      <Footer />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </main>
  );
}
