"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import PaywallModal from "@/components/PaywallModal";
import BirthDataForm from "@/components/BirthDataForm";
import Footer from "@/components/Footer";
import { ApiError, fetchChartPositions } from "@/lib/api";
import { saveChart, setActiveChartId } from "@/lib/storage";
import type { BirthData } from "@/lib/types";

const PILLARS = [
  {
    degree: "1°",
    num: "Doctrine",
    title: "True to the sources",
    body: "Interpretations drawn from Ptolemy's Tetrabiblos and Valens' Anthologies — no blending with modern psychological astrology.",
  },
  {
    degree: "2°",
    num: "Method",
    title: "Rules, not intuition",
    body: "Whole sign houses, Ptolemaic orbs, seven classical planets. One consistent technical system throughout, no shortcuts.",
  },
  {
    degree: "3°",
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
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const handleCast = async (birth: BirthData) => {
    setChartLoading(true);
    setChartError(null);
    try {
      const chart = await fetchChartPositions(birth);
      const id = crypto.randomUUID();
      saveChart({ id, birthData: birth, chart, messages: [], createdAt: new Date().toISOString() });
      setActiveChartId(id);
      router.push("/hub");
    } catch (e) {
      setChartError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setChartLoading(false);
    }
  };

  return (
    <div className="bg-parchment text-ink">
      <Nav onSignInClick={() => setPaywallOpen(true)} />

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center sm:px-10">
          <p className="mb-6 font-cinzel text-[11px] uppercase tracking-[0.16em] text-terracotta">
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
            <div className="shrink-0 border border-line bg-parchment-2 p-6">
            <svg viewBox="0 0 280 280" className="h-[280px] w-[280px]">
              <circle cx="140" cy="140" r="128" fill="none" stroke="#1B2438" strokeWidth="1" />
              <circle cx="140" cy="140" r="98" fill="none" stroke="#8F6A35" strokeWidth="1" />
              <g stroke="rgba(27,36,56,0.14)" strokeWidth="0.75">
                <line x1="140" y1="12" x2="140" y2="268" />
                <line x1="12" y1="140" x2="268" y2="140" />
                <line x1="49" y1="49" x2="231" y2="231" />
                <line x1="49" y1="231" x2="231" y2="49" />
                <line x1="140" y1="42" x2="140" y2="238" transform="rotate(30 140 140)" />
                <line x1="140" y1="42" x2="140" y2="238" transform="rotate(60 140 140)" />
                <line x1="140" y1="42" x2="140" y2="238" transform="rotate(120 140 140)" />
                <line x1="140" y1="42" x2="140" y2="238" transform="rotate(150 140 140)" />
              </g>
              <line x1="12" y1="140" x2="268" y2="140" stroke="#A8553C" strokeWidth="1.5" />
              <text x="248" y="145" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ☉
              </text>
              <text x="220" y="66" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ☽
              </text>
              <text x="128" y="24" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ☿
              </text>
              <text x="46" y="66" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ♀
              </text>
              <text x="18" y="145" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ♂
              </text>
              <text x="46" y="220" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ♃
              </text>
              <text x="128" y="262" fontFamily="var(--font-cormorant)" fontSize="13" fill="#3C4658">
                ♄
              </text>
            </svg>
            </div>

            <BirthDataForm onSubmit={handleCast} loading={chartLoading} error={chartError} />
          </div>

          {chartLoading && (
            <p className="mt-6 text-center font-cormorant text-lg italic text-bronze-dark">Casting your chart…</p>
          )}
        </section>

      <section id="pillars" className="border-y border-line">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
          <div className="border-t border-line">
            {PILLARS.map((p) => (
              <div
                key={p.num}
                className="grid gap-2 border-b border-line py-8 sm:grid-cols-[56px_1fr_1.3fr] sm:items-baseline sm:gap-10 sm:py-10"
              >
                <span className="font-cinzel text-2xl text-bronze-dark">{p.degree}</span>
                <div>
                  <div className="mb-1.5 font-cinzel text-[11px] tracking-[0.16em] text-terracotta">{p.num}</div>
                  <h3 className="font-cinzel text-[19px] font-semibold">{p.title}</h3>
                </div>
                <p className="font-cormorant text-base leading-relaxed text-ink-2">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <div className="text-center">
          <h2 className="font-cinzel text-3xl font-semibold">How it works</h2>
          <p className="mt-2 font-cormorant text-lg italic text-ink-2">
            Three steps to a source-grounded reading
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-line sm:left-0 sm:right-0 sm:top-6 sm:bottom-auto sm:h-px sm:w-auto" />
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.roman} className="relative flex gap-5 sm:block sm:text-center">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bronze-dark bg-parchment font-cinzel text-sm text-bronze-dark sm:mx-auto">
                  {s.roman}
                </span>
                <div className="sm:mt-6">
                  <h4 className="mb-2 font-cinzel text-[17px] font-semibold">{s.title}</h4>
                  <p className="font-cormorant text-[15px] text-ink-2">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-parchment-2 px-6 py-24 text-center">
        <p className="font-cinzel text-[11px] uppercase tracking-[0.16em] text-terracotta">
          Cast in minutes
        </p>
        <h2 className="mx-auto mt-4 max-w-xl font-cinzel text-3xl font-semibold text-ink">
          See what the sources say about your chart
        </h2>
        <Link
          href="/chart"
          className="mt-10 inline-block border border-ink bg-ink px-8 py-3 font-cinzel text-[13px] uppercase tracking-[0.12em] text-parchment transition-colors hover:bg-ink-2"
        >
          Discover Your Chart
        </Link>
      </section>

      <Footer />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
