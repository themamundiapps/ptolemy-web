"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PricingCard from "@/components/PricingCard";
import PaywallModal from "@/components/PaywallModal";
import Footer from "@/components/Footer";
import { parseLooseDate, parseLooseTime } from "@/lib/dateParsing";

const PILLARS = [
  {
    num: "Doctrine",
    title: "True to the sources",
    body: "Interpretations drawn from Ptolemy's Tetrabiblos and Valens' Anthologies — no blending with modern psychological astrology.",
  },
  {
    num: "Method",
    title: "Rules, not intuition",
    body: "Whole sign houses, Ptolemaic orbs, seven classical planets. One consistent technical system throughout, no shortcuts.",
  },
  {
    num: "Application",
    title: "Elections and temperament",
    body: "From the natal chart to traditional electional astrology — choose the right moment by the same criteria the ancients used.",
  },
];

const STEPS = [
  {
    roman: "I",
    title: "Enter date, time and place",
    body: "Your exact birth details, used to calculate planetary positions and houses precisely.",
  },
  {
    roman: "II",
    title: "Read the full chart",
    body: "Planets, lots, aspects and house lords — each section carries its own traditional interpretation.",
  },
  {
    roman: "III",
    title: "Go deeper with the text",
    body: "Every reading points back to its source doctrine — for those who want to understand the why, not just the what.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");

  const handleCast = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const isoDate = parseLooseDate(date);
    const isoTime = parseLooseTime(time);
    if (isoDate) params.set("date", isoDate);
    if (isoTime) params.set("time", isoTime);
    if (place.trim()) params.set("place", place.trim());
    const qs = params.toString();
    router.push(qs ? `/chart?${qs}` : "/chart");
  };

  return (
    <div className="bg-parchment text-navy">
      <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-hairline px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bronze-dark font-cinzel text-[15px] text-bronze-dark">
            Ϙ
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-cinzel text-xl font-semibold tracking-wide">Ptolemy</span>
            <span className="font-ebgaramond text-[10px] uppercase tracking-[0.22em] text-navy2">
              Traditional Astrology
            </span>
          </div>
        </div>
        <div className="hidden items-center gap-8 font-ebgaramond text-[15px] md:flex">
          <a href="#pillars" className="border-b border-transparent pb-1 hover:border-bronze-dark">
            Features
          </a>
          <Link href="/chart" className="border-b border-transparent pb-1 hover:border-bronze-dark">
            Chart
          </Link>
          <a href="#process" className="border-b border-transparent pb-1 hover:border-bronze-dark">
            Guide
          </a>
          <a href="#pricing" className="border-b border-transparent pb-1 hover:border-bronze-dark">
            Pricing
          </a>
        </div>
        <button
          onClick={() => setPaywallOpen(true)}
          className="border border-navy px-5 py-2 font-ebgaramond text-sm tracking-wide text-navy transition-colors hover:bg-navy hover:text-parchment"
        >
          Sign in
        </button>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:px-10">
        <p className="mb-6 font-ebgaramond text-xs uppercase tracking-[0.35em] text-terracotta">
          After the Tetrabiblos and Valens&apos; Anthologies
        </p>
        <h1 className="mx-auto max-w-3xl font-cinzel text-4xl font-semibold leading-tight sm:text-5xl md:text-[50px]">
          Astrology as it was <em className="font-cormorant italic font-medium text-terracotta">before</em> it
          became entertainment
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-cormorant text-xl italic text-navy2">
          Ptolemy reads your chart by the rules of the Hellenistic tradition — whole sign houses,
          Ptolemaic orbs, the seven classical planets — and nothing else.
        </p>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-16 gap-y-10">
          <svg viewBox="0 0 280 280" className="h-[280px] w-[280px] shrink-0">
            <circle cx="140" cy="140" r="128" fill="none" stroke="#1B2438" strokeWidth="1" />
            <circle cx="140" cy="140" r="98" fill="none" stroke="#8A6B3D" strokeWidth="1" />
            <g stroke="rgba(27,36,56,0.18)" strokeWidth="0.75">
              <line x1="140" y1="12" x2="140" y2="268" />
              <line x1="12" y1="140" x2="268" y2="140" />
              <line x1="49" y1="49" x2="231" y2="231" />
              <line x1="49" y1="231" x2="231" y2="49" />
              <line x1="140" y1="42" x2="140" y2="238" transform="rotate(30 140 140)" />
              <line x1="140" y1="42" x2="140" y2="238" transform="rotate(60 140 140)" />
              <line x1="140" y1="42" x2="140" y2="238" transform="rotate(120 140 140)" />
              <line x1="140" y1="42" x2="140" y2="238" transform="rotate(150 140 140)" />
            </g>
            <line x1="12" y1="140" x2="268" y2="140" stroke="#8C3B2E" strokeWidth="1.5" />
            <text x="248" y="145" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ☉
            </text>
            <text x="220" y="66" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ☽
            </text>
            <text x="128" y="24" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ☿
            </text>
            <text x="46" y="66" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ♀
            </text>
            <text x="18" y="145" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ♂
            </text>
            <text x="46" y="220" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ♃
            </text>
            <text x="128" y="262" fontFamily="var(--font-ebgaramond)" fontSize="13" fill="#2A3550">
              ♄
            </text>
          </svg>

          <form
            onSubmit={handleCast}
            className="w-full max-w-[380px] border border-navy bg-parchment2 p-8 text-left"
          >
            <div className="mb-5 border-b border-hairline pb-3.5 font-cinzel text-sm uppercase tracking-[0.1em]">
              Cast your chart
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-navy2">
                Date of birth
              </label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD / MM / YYYY"
                className="w-full border border-hairline bg-parchment px-3 py-2.5 font-serif text-[15px] text-navy placeholder:text-[#9a927e]"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-navy2">
                Time of birth
              </label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Needed for your Ascendant and houses"
                className="w-full border border-hairline bg-parchment px-3 py-2.5 font-serif text-[15px] text-navy placeholder:text-[#9a927e]"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-navy2">
                Place of birth
              </label>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="City, country"
                className="w-full border border-hairline bg-parchment px-3 py-2.5 font-serif text-[15px] text-navy placeholder:text-[#9a927e]"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-navy py-3 font-cinzel text-[13px] uppercase tracking-[0.12em] text-parchment transition-colors hover:bg-navy2"
            >
              Calculate chart
            </button>
            <p className="mt-3.5 text-center font-ebgaramond text-[12.5px] italic text-navy2">
              Free to start. Sign in to save your chart.
            </p>
          </form>
        </div>
      </section>

      <section id="pillars" className="border-y border-hairline">
        <div className="mx-auto grid max-w-5xl gap-y-10 px-6 py-14 sm:grid-cols-3 sm:px-10">
          {PILLARS.map((p, i) => (
            <div key={p.num} className={`px-0 sm:px-8 ${i > 0 ? "sm:border-l sm:border-hairline" : ""}`}>
              <div className="mb-3.5 font-cinzel text-xs tracking-[0.15em] text-bronze-dark">{p.num}</div>
              <h3 className="mb-3 font-cinzel text-[19px] font-semibold">{p.title}</h3>
              <p className="font-serif text-[15.5px] leading-relaxed text-navy2">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-5xl px-6 py-20 text-center sm:px-10">
        <h2 className="font-cinzel text-3xl font-semibold">How it works</h2>
        <p className="mt-2 font-cormorant text-lg italic text-navy2">
          Three steps to a source-grounded reading
        </p>
        <div className="mt-14 grid gap-11 text-left sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.roman}>
              <span className="mb-4 block font-cinzel text-2xl tracking-[0.05em] text-terracotta">
                {s.roman}
              </span>
              <div className="mb-4 h-px bg-hairline" />
              <h4 className="mb-2.5 font-cinzel text-[17px] font-semibold">{s.title}</h4>
              <p className="font-serif text-[15px] text-navy2">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-background px-6 py-24 text-ink">
        <h2 className="text-center font-serif text-3xl">Pricing</h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
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
    </div>
  );
}
