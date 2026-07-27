"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import ChartWheel from "@/components/ChartWheel";
import ChatDock from "@/components/ChatDock";
import { ApiError, fetchChartAnalysis } from "@/lib/api";
import { getGoogleUser } from "@/lib/auth";
import { FREE_MESSAGE_LIMIT, getChart, getOrCreateDeviceId, saveChart, totalUserMessageCount } from "@/lib/storage";
import {
  ASPECT_SYMBOLS,
  DOMICILE_RULERS,
  HARMONIOUS_ASPECTS,
  PLANET_ORDER,
  PLANET_SYMBOLS,
  dignitySummary,
  formatDegree,
  housesRuledBy,
} from "@/lib/astro";
import type { ChatMessage, SavedChart } from "@/lib/types";

const TOC = [
  { id: "s-character", label: "Character" },
  { id: "s-planets", label: "Dominant Planets" },
  { id: "s-dignities", label: "Dignities" },
  { id: "s-aspects", label: "Key Aspects" },
  { id: "s-lots", label: "Lots" },
  { id: "s-synthesis", label: "Synthesis" },
];

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};
const ELEMENT_HUMOR: Record<string, string> = {
  Fire: "Choleric",
  Earth: "Melancholic",
  Air: "Sanguine",
  Water: "Phlegmatic",
};

function paragraphsFromAnalysis(analysis?: string): string[] {
  if (!analysis) return [];
  return analysis
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^#+\s+\S.*$/.test(p) || p.includes("\n"))
    .map((p) => p.replace(/^#+\s*/, "").trim());
}

function splitPullQuote(paragraph: string): { quote: string | null; body: string } {
  if (!paragraph) return { quote: null, body: "" };
  const sentences = paragraph.split(/(?<=[.?!])\s+/);
  const idx = sentences.findIndex((s) => s.includes("—"));
  if (idx === -1) return { quote: null, body: paragraph };
  const quote = sentences[idx].trim();
  const body = sentences.filter((_, i) => i !== idx).join(" ").trim();
  return { quote, body: body || paragraph };
}

function extractTemperament(paragraph: string): string | null {
  const m = paragraph.match(
    /(sanguine|choleric|melancholic|phlegmatic)(-(sanguine|choleric|melancholic|phlegmatic))?\s+temperament/i,
  );
  if (!m) return null;
  return m[0]
    .replace(/\s+temperament/i, "")
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("-");
}

function dominantPlanets(paragraph: string): string[] {
  return PLANET_ORDER.map((p) => ({ p, idx: paragraph.indexOf(p) }))
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx)
    .slice(0, 2)
    .map((x) => x.p);
}

export default function ReadingPage() {
  const params = useParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedChart | null | undefined>(undefined);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [remaining, setRemaining] = useState(FREE_MESSAGE_LIMIT);
  const [activeSection, setActiveSection] = useState(TOC[0].id);

  useEffect(() => {
    setUserId(getGoogleUser()?.id ?? getOrCreateDeviceId());
    setSaved(getChart(params.id));
  }, [params.id]);

  useEffect(() => {
    if (!saved || saved.analysis || analysisLoading) return;
    setAnalysisLoading(true);
    fetchChartAnalysis(saved.birthData, userId)
      .then(({ analysis }) => {
        const updated = { ...saved, analysis };
        saveChart(updated);
        setSaved(updated);
      })
      .catch((e) => setAnalysisError(e instanceof ApiError ? e.message : "Could not generate this reading."))
      .finally(() => setAnalysisLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.id, userId]);

  useEffect(() => {
    setRemaining(Math.max(FREE_MESSAGE_LIMIT - totalUserMessageCount(), 0));
  }, [saved?.messages]);

  useEffect(() => {
    const sections = TOC.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -70% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [saved?.analysis]);

  const handleMessagesChange = (messages: ChatMessage[]) => {
    if (!saved) return;
    const updated = { ...saved, messages };
    saveChart(updated);
    setSaved(updated);
  };

  const paragraphs = useMemo(() => paragraphsFromAnalysis(saved?.analysis), [saved?.analysis]);
  const chart = saved?.chart;

  const temperament = useMemo(() => {
    if (!chart) return null;
    return extractTemperament(paragraphs[0] ?? "") ?? ELEMENT_HUMOR[SIGN_ELEMENT[chart.ascendant.sign]] ?? "—";
  }, [chart, paragraphs]);

  const ruler = chart ? DOMICILE_RULERS[chart.ascendant.sign] : null;
  const { quote: charQuote, body: charBody } = splitPullQuote(paragraphs[0] ?? "");

  const dominant = useMemo(() => dominantPlanets(paragraphs[1] ?? ""), [paragraphs]);
  const spotlights = useMemo(() => {
    if (!chart) return [];
    return dominant
      .map((planet) => {
        const pos = chart.planets[planet];
        if (!pos) return null;
        const houses = housesRuledBy(planet, chart.ascendant.sign);
        const housesText = houses.length
          ? `Rules House${houses.length > 1 ? "s" : ""} ${houses.join(" and ")}`
          : "Rules no house from this Ascendant";
        const dignityText = pos.dignities.length
          ? `Dignified here by ${pos.dignities.join(" and ")}, lending its rulership real strength.`
          : "Peregrine here, ruling without essential dignity to anchor its authority.";
        return {
          planet,
          title: `${planet} in ${pos.sign}, House ${pos.house}`,
          desc: `${housesText}. ${dignityText}`,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [chart, dominant]);
  const { quote: planetsQuote, body: planetsBody } = splitPullQuote(paragraphs[1] ?? "");

  const dignities = useMemo(() => (chart ? dignitySummary(chart.planets) : { dignified: [], peregrine: [] }), [chart]);
  const { quote: dignitiesQuote, body: dignitiesBody } = splitPullQuote(paragraphs[2] ?? "");

  const topAspects = useMemo(() => {
    if (!chart) return [];
    return [...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 5);
  }, [chart]);
  const { quote: aspectsQuote, body: aspectsBody } = splitPullQuote(paragraphs[3] ?? "");

  const { quote: synthesisQuote, body: synthesisBody } = splitPullQuote(paragraphs[4] ?? "");

  if (saved === undefined) {
    return (
      <div className="pt-app min-h-screen">
        <AppNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (saved === null) {
    return (
      <div className="pt-app min-h-screen">
        <AppNav />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p>We couldn&apos;t find that chart on this device.</p>
          <Link href="/chart" style={{ color: "var(--bronze-deep)" }}>
            Cast a new chart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-app min-h-screen">
      <AppNav />

      <div className="read-header">
        <div className="eyebrow">A Reading of the Nativity</div>
        <h1>{saved.birthData.name ? `The Chart of ${saved.birthData.name}` : "Your Chart"}</h1>
        <div className="meta">
          {saved.birthData.date} · {saved.birthData.time} · {saved.birthData.place_name}
        </div>
        <span className="sect-badge">
          {saved.chart.sect === "diurnal" ? "Diurnal" : "Nocturnal"} Sect · {saved.chart.ascendant.sign} Ascendant
        </span>
      </div>

      <div className="read-toc">
        {TOC.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={activeSection === t.id ? "current" : ""}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="read-body">
        <div className="chart-pane">
          <ChartWheel chart={saved.chart} />
          <div className="cap">Whole sign houses · Ptolemaic orbs</div>
        </div>

        <div className="col-text">
          <div className="section-card" id="s-character">
            <div className="s-eyebrow">
              <span className="n">I</span>
              <span className="n">— Character and Temperament</span>
            </div>
            <h2>{temperament ? `A ${temperament.toLowerCase()} nativity` : "Character and temperament"}</h2>
            <div className="fact-strip">
              <div className="fact">
                Sect <b>{saved.chart.sect === "diurnal" ? "Diurnal" : "Nocturnal"}</b>
              </div>
              <div className="fact">
                Ascendant <b>{saved.chart.ascendant.sign}</b>
              </div>
              {ruler && (
                <div className="fact">
                  Ruler{" "}
                  <b>
                    {saved.chart.ascendant.sign} → {ruler}
                  </b>
                </div>
              )}
              {temperament && (
                <div className="fact">
                  Temperament <b>{temperament}</b>
                </div>
              )}
            </div>
            {analysisLoading && !saved.analysis && (
              <p style={{ fontStyle: "italic" }}>The astrologer is casting this reading…</p>
            )}
            {analysisError && !saved.analysis && <p style={{ color: "var(--terracotta)" }}>{analysisError}</p>}
            {charBody && <p>{charBody}</p>}
            {charQuote && <p className="pull">&ldquo;{charQuote}&rdquo;</p>}
          </div>

          <div className="section-card" id="s-planets">
            <div className="s-eyebrow">
              <span className="n">II</span>
              <span className="n">— Dominant Planets</span>
            </div>
            <h2>
              {dominant.length === 2
                ? `${dominant[0]} and ${dominant[1]} govern the chart`
                : dominant.length === 1
                  ? `${dominant[0]} governs the chart`
                  : "The chart's guiding planets"}
            </h2>
            {analysisLoading && !saved.analysis && (
              <p style={{ fontStyle: "italic" }}>Reading the dominant planets…</p>
            )}
            {planetsBody && <p>{planetsBody}</p>}
            {planetsQuote && <p className="pull">&ldquo;{planetsQuote}&rdquo;</p>}
            {spotlights.map((s) => (
              <div className="aspect-item" key={s.planet}>
                <div className="orb">{PLANET_SYMBOLS[s.planet] ?? s.planet.slice(0, 2)}</div>
                <div>
                  <div className="a-title">{s.title}</div>
                  <div className="a-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-card" id="s-dignities">
            <div className="s-eyebrow">
              <span className="n">III</span>
              <span className="n">— Essential Dignities</span>
            </div>
            <h2>
              {dignities.dignified.length > 0
                ? `${dignities.dignified.map((d) => d.name).join(" and ")} hold${
                    dignities.dignified.length === 1 ? "s" : ""
                  } essential dignity`
                : "No planet holds essential dignity here"}
            </h2>
            {dignitiesBody && <p>{dignitiesBody}</p>}
            {dignitiesQuote && <p className="pull">&ldquo;{dignitiesQuote}&rdquo;</p>}
            {dignities.dignified.map((d) => (
              <div className="aspect-item" key={d.name}>
                <div className="orb">{PLANET_SYMBOLS[d.name] ?? d.name.slice(0, 2)}</div>
                <div>
                  <div className="a-title">
                    {d.name} — {d.value}
                  </div>
                </div>
              </div>
            ))}
            {dignities.peregrine.length > 0 && (
              <div className="aspect-item">
                <div className="orb">—</div>
                <div>
                  <div className="a-title">{dignities.peregrine.join(", ")}</div>
                  <div className="a-desc">Peregrine — without essential dignity in this chart.</div>
                </div>
              </div>
            )}
          </div>

          <div className="section-card" id="s-aspects">
            <div className="s-eyebrow">
              <span className="n">IV</span>
              <span className="n">— Key Aspects</span>
            </div>
            <h2>
              {topAspects[0]
                ? `${topAspects[0].planet_a} ${topAspects[0].aspect} ${topAspects[0].planet_b} anchors the chart`
                : "Key aspects"}
            </h2>
            {aspectsBody && <p>{aspectsBody}</p>}
            {aspectsQuote && <p className="pull">&ldquo;{aspectsQuote}&rdquo;</p>}
            {topAspects.map((a, i) => (
              <div className="aspect-item" key={i}>
                <div className="orb">{formatDegree(a.orb)}</div>
                <div>
                  <div className="a-title">
                    {a.planet_a} {ASPECT_SYMBOLS[a.aspect] ?? ""} {a.planet_b}
                  </div>
                  <div className="a-desc">
                    {HARMONIOUS_ASPECTS.has(a.aspect) ? "A harmonious configuration" : "A challenging configuration"}{" "}
                    — {a.aspect}, orb {formatDegree(a.orb)}.
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-card" id="s-lots">
            <div className="s-eyebrow">
              <span className="n">V</span>
              <span className="n">— Hellenistic Lots</span>
            </div>
            <h2>
              Fortune in {saved.chart.lot_of_fortune.sign}, Spirit in {saved.chart.lot_of_spirit.sign}
            </h2>
            <p>
              The Lot of Fortune falls in {saved.chart.lot_of_fortune.sign}, House {saved.chart.lot_of_fortune.house}{" "}
              — indicating that material fortune and bodily circumstance flow through the affairs of that house. The
              Lot of Spirit falls in {saved.chart.lot_of_spirit.sign}, House {saved.chart.lot_of_spirit.house} —
              pointing to where the native&apos;s deeds and sense of purpose take shape.
            </p>
          </div>

          <div className="section-card" id="s-synthesis">
            <div className="s-eyebrow">
              <span className="n">VI</span>
              <span className="n">— Synthesis</span>
            </div>
            <h2>According to the Ptolemaic tradition</h2>
            {analysisLoading && !saved.analysis && <p style={{ fontStyle: "italic" }}>Weaving the synthesis…</p>}
            {synthesisBody && <p>{synthesisBody}</p>}
            {synthesisQuote && <p className="pull">&ldquo;{synthesisQuote}&rdquo;</p>}
            <div className="go-deeper">
              Every statement above traces back to its source — the Tetrabiblos, Valens&apos; Anthologies — available
              at a touch.
            </div>
          </div>

          <ChatDock
            birth={saved.birthData}
            userId={userId}
            messages={saved.messages}
            onMessagesChange={handleMessagesChange}
            remaining={remaining}
          />
        </div>
      </div>
    </div>
  );
}
