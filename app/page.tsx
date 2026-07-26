"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import PricingCard from "@/components/PricingCard";
import PaywallModal from "@/components/PaywallModal";
import BirthDataForm from "@/components/BirthDataForm";
import ChartResults from "@/components/ChartResults";
import Footer from "@/components/Footer";
import { ApiError, fetchChartAnalysis, fetchChartPositions } from "@/lib/api";
import { getGoogleUser } from "@/lib/auth";
import { getOrCreateDeviceId } from "@/lib/storage";
import type { BirthData, ChartResponse, ChatMessage } from "@/lib/types";

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
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [userId, setUserId] = useState("");

  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [result, setResult] = useState<{ birth: BirthData; chart: ChartResponse } | null>(null);
  const [analysis, setAnalysis] = useState<string | undefined>();
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setUserId(getGoogleUser()?.id ?? getOrCreateDeviceId());
  }, []);

  const handleCast = async (birth: BirthData) => {
    setChartLoading(true);
    setChartError(null);
    try {
      const chart = await fetchChartPositions(birth);
      setResult({ birth, chart });
      setMessages([]);
      setAnalysis(undefined);
      setAnalysisError(null);
      setAnalysisLoading(true);
      fetchChartAnalysis(birth, userId)
        .then(({ analysis }) => setAnalysis(analysis))
        .catch((e) => setAnalysisError(e instanceof ApiError ? e.message : "Could not generate a reading."))
        .finally(() => setAnalysisLoading(false));
    } catch (e) {
      setChartError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div className="bg-parchment text-ink">
      <Nav onSignInClick={() => setPaywallOpen(true)} />

      {result ? (
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 sm:px-10">
          <div className="mb-10 text-center">
            <h1 className="font-cinzel text-3xl font-semibold text-ink">
              {result.birth.name ? `${result.birth.name}'s Chart` : "Your Chart"}
            </h1>
            <p className="mt-2 font-cormorant italic text-ink-2">
              {result.birth.date} · {result.birth.time} · {result.birth.place_name}
            </p>
          </div>
          <ChartResults
            birth={result.birth}
            chart={result.chart}
            analysis={analysis}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            messages={messages}
            onMessagesChange={setMessages}
            userId={userId}
            onUpgradeClick={() => setPaywallOpen(true)}
          />
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:px-10">
          <p className="mb-6 font-ebgaramond text-xs uppercase tracking-[0.35em] text-terracotta">
            After the Tetrabiblos and Valens&apos; Anthologies
          </p>
          <h1 className="mx-auto max-w-3xl font-cinzel text-4xl font-semibold leading-tight sm:text-5xl md:text-[50px]">
            Astrology as it was <em className="font-cormorant italic font-medium text-terracotta">before</em> it
            became entertainment
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-cormorant text-xl italic text-ink-2">
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

            <BirthDataForm onSubmit={handleCast} loading={chartLoading} error={chartError} />
          </div>

          {chartLoading && (
            <p className="mt-6 text-center font-cormorant text-lg italic text-bronze-dark">Casting your chart…</p>
          )}
        </section>
      )}

      <section id="pillars" className="border-y border-line">
        <div className="mx-auto grid max-w-5xl gap-y-10 px-6 py-14 sm:grid-cols-3 sm:px-10">
          {PILLARS.map((p, i) => (
            <div key={p.num} className={`px-0 sm:px-8 ${i > 0 ? "sm:border-l sm:border-line" : ""}`}>
              <div className="mb-3.5 font-cinzel text-xs tracking-[0.15em] text-bronze-dark">{p.num}</div>
              <h3 className="mb-3 font-cinzel text-[19px] font-semibold">{p.title}</h3>
              <p className="font-crimson text-[15.5px] leading-relaxed text-ink-2">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-5xl px-6 py-20 text-center sm:px-10">
        <h2 className="font-cinzel text-3xl font-semibold">How it works</h2>
        <p className="mt-2 font-cormorant text-lg italic text-ink-2">
          Three steps to a source-grounded reading
        </p>
        <div className="mt-14 grid gap-11 text-left sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.roman}>
              <span className="mb-4 block font-cinzel text-2xl tracking-[0.05em] text-terracotta">
                {s.roman}
              </span>
              <div className="mb-4 h-px bg-line" />
              <h4 className="mb-2.5 font-cinzel text-[17px] font-semibold">{s.title}</h4>
              <p className="font-crimson text-[15px] text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-parchment-2 px-6 py-24">
        <h2 className="text-center font-cinzel text-3xl font-semibold text-ink">Pricing</h2>
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
