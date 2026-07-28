"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { ApiError, fetchTransits } from "@/lib/api";
import { getGoogleUser } from "@/lib/auth";
import {
  FREE_MESSAGE_LIMIT,
  getActiveChartId,
  getChart,
  totalUserMessageCount,
} from "@/lib/storage";
import { PLANET_SYMBOLS, formatDegree } from "@/lib/astro";
import type { TabKey } from "@/lib/tabs";
import type { SavedChart, TransitsResponse } from "@/lib/types";

const FEATURES: {
  glyph: string;
  name: string;
  desc: string;
  pro: boolean;
  tab?: TabKey;
}[] = [
  {
    glyph: "☌",
    name: "House Lords",
    desc: "12 interpretations — who rules each area of your life",
    pro: false,
    tab: "house-lords",
  },
  {
    glyph: "⚕",
    name: "Temperament",
    desc: "Humoral complexion and recommendations from Tetrabiblos III",
    pro: true,
    tab: "temperament",
  },
  {
    glyph: "⚡",
    name: "Electional Astrology",
    desc: "Choose the best moment by the essential criteria",
    pro: true,
    tab: "electional",
  },
  {
    glyph: "⚭",
    name: "Synastry",
    desc: "Interaspects and house overlay between two charts",
    pro: true,
    tab: "synastry",
  },
  {
    glyph: "☀",
    name: "Annual Profections",
    desc: "Lord of the Year and the profection technique",
    pro: false,
  },
  {
    glyph: "✦",
    name: "Hellenistic Lots",
    desc: "Fortune, Spirit and the derived lots",
    pro: false,
    tab: "chart",
  },
];

function formatToday(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function moonPhaseWord(phaseName: string, phaseAngle: number): string {
  const lower = phaseName.toLowerCase();
  if (lower.includes("waxing")) return "waxing";
  if (lower.includes("waning")) return "waning";
  return phaseAngle < 180 ? "waxing" : "waning";
}

export default function HubPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedChart | null | undefined>(undefined);
  const [firstName, setFirstName] = useState("there");
  const [transits, setTransits] = useState<TransitsResponse | null>(null);
  const [transitsLoading, setTransitsLoading] = useState(false);
  const [transitsError, setTransitsError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(FREE_MESSAGE_LIMIT);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const id = getActiveChartId();
    setSaved(id ? getChart(id) : null);
    const user = getGoogleUser();
    setFirstName(user?.name?.split(" ")[0] ?? "there");
    setRemaining(Math.max(FREE_MESSAGE_LIMIT - totalUserMessageCount(), 0));
  }, []);

  useEffect(() => {
    if (!saved) return;
    setTransitsLoading(true);
    setTransitsError(null);
    fetchTransits(saved.birthData)
      .then(setTransits)
      .catch((e) =>
        setTransitsError(
          e instanceof ApiError ? e.message : "Could not read today's sky.",
        ),
      )
      .finally(() => setTransitsLoading(false));
  }, [saved]);

  const sunPosition = saved?.chart.planets["Sun"];

  const skyRows = useMemo(() => {
    if (!transits) return [];
    type Row = {
      key: string;
      glyph: string;
      name: string;
      detail: string;
      favorable: boolean;
    };
    const rows: Row[] = [];

    if (transits.moon_position) {
      const mp = transits.moon_position;
      const aspect = transits.moon_natal_aspect;
      rows.push({
        key: "moon",
        glyph: PLANET_SYMBOLS.Moon,
        name: `Moon in ${mp.sign} transits your House ${mp.house}`,
        detail: aspect
          ? `${aspect.is_applying ? "Applying" : "Separating"} ${aspect.aspect} to natal ${aspect.natal_planet} — ${formatDegree(aspect.orb)}`
          : "No major aspect to a natal planet forming right now",
        favorable: aspect ? aspect.is_harmonious : true,
      });
    }

    const sorted = [...transits.transits].sort((a, b) => a.orb - b.orb);
    for (const t of sorted) {
      if (rows.length >= 3) break;
      const isMoonAspect =
        transits.moon_natal_aspect &&
        t.transiting_planet === transits.moon_natal_aspect.transiting_planet &&
        t.natal_planet === transits.moon_natal_aspect.natal_planet;
      if (isMoonAspect) continue;
      rows.push({
        key: `${t.transiting_planet}-${t.natal_planet}-${t.aspect}`,
        glyph:
          PLANET_SYMBOLS[t.transiting_planet] ??
          t.transiting_planet.slice(0, 2),
        name: `Transiting ${t.transiting_planet} ${t.aspect} natal ${t.natal_planet}`,
        detail: `${t.is_applying ? "Applying" : "Separating"} — orb ${formatDegree(t.orb)}`,
        favorable: t.is_harmonious,
      });
    }
    return rows.slice(0, 3);
  }, [transits]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!saved) {
      router.push("/chart");
      return;
    }
    router.push(
      `/reading/${saved.id}?tab=ask${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    );
  };

  return (
    <div className="pt-app min-h-screen">
      <AppNav />

      <div className="hub-header">
        <div className="eyebrow">
          {sunPosition
            ? `Sun in ${sunPosition.sign} · House ${sunPosition.house}`
            : "Casting your sky…"}
        </div>
        <h1>Welcome back, {firstName}.</h1>
        <div className="today">
          {formatToday()}
          {transits &&
            ` — Moon in ${transits.moon_position.sign}, ${moonPhaseWord(
              transits.moon_position.phase_name,
              transits.moon_position.phase_angle,
            )}`}
        </div>
      </div>

      <div className="consult-banner">
        <div className="cb-left">
          <h2>Ask the Astrologer</h2>
          <p>
            Your chart is open. Ask anything about your nativity — planets,
            houses, timing, temperament.
          </p>
        </div>
        <div className="cb-right">
          <form className="cb-input" onSubmit={handleAsk}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What does my chart say about…"
            />
            <button type="submit">Ask</button>
          </form>
          <div className="cb-remaining">
            {remaining} question{remaining === 1 ? "" : "s"} remaining today
          </div>
        </div>
      </div>

      <div className="hub-grid">
        <div className="hub-col-left">
          <div className="ledger" id="today-sky">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Today&apos;s Sky
            </div>
            <h3>Transits touching your chart</h3>
            <div className="meta">
              {saved
                ? "Calculated against your natal chart · Ptolemaic orbs"
                : "Cast a chart to see your live transits"}
            </div>

            {transitsLoading && (
              <p style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>
                Reading the sky…
              </p>
            )}
            {transitsError && (
              <p style={{ color: "var(--terracotta)" }}>{transitsError}</p>
            )}
            {saved === null && (
              <p>
                <Link href="/chart" style={{ color: "var(--bronze-deep)" }}>
                  Cast your chart
                </Link>{" "}
                to unlock today&apos;s transits, dignities and readings.
              </p>
            )}

            {skyRows.map((row) => (
              <div className="transit-row" key={row.key}>
                <div className="glyph">{row.glyph}</div>
                <div>
                  <div className="t-name">{row.name}</div>
                  <div className="t-detail">{row.detail}</div>
                </div>
                <div className={`t-tag${row.favorable ? "" : " muted"}`}>
                  {row.favorable ? "Favorable" : "Caution"}
                </div>
              </div>
            ))}

            {skyRows.length > 0 && (
              <div className="go-deeper" style={{ marginTop: 16 }}>
                Each transit traces back to its doctrine — Valens on the Moon
                applying, Ptolemy on squares between signs of aversion.
              </div>
            )}
          </div>

          <div className="ledger">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Your Techniques
            </div>
            <h3>What your chart still has to say</h3>
            <p style={{ marginBottom: 0 }}>
              Every traditional technique, in one place — no need to go looking.
            </p>
            <div className="feature-grid">
              {FEATURES.map((f) => {
                const inner = (
                  <>
                    {f.pro && <span className="pro">PRO</span>}
                    <span className="glyph">{f.glyph}</span>
                    <span className="name">{f.name}</span>
                    <span className="desc">{f.desc}</span>
                  </>
                );
                return f.tab && saved ? (
                  <Link
                    href={`/reading/${saved.id}?tab=${f.tab}`}
                    className="feature-tile"
                    style={{ cursor: "pointer", display: "block" }}
                    key={f.name}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="feature-tile" key={f.name}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hub-col-right">
          <div className="side-card">
            <h4>Your Records</h4>
            <div className="doc-list">
              {saved ? (
                <>
                  <Link href={`/reading/${saved.id}?tab=chart`}>
                    Full natal chart <span className="arrow">→</span>
                  </Link>
                  <Link href={`/reading/${saved.id}?tab=analysis`}>
                    Nativity reading <span className="arrow">→</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/chart">
                    Full natal chart <span className="arrow">→</span>
                  </Link>
                  <Link href="/chart">
                    Nativity reading <span className="arrow">→</span>
                  </Link>
                </>
              )}
              <a className="disabled">
                Annual profection 2026 <span className="arrow">→</span>
              </a>
              <a className="disabled">
                Saved elections <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
