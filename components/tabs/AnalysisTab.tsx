"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, fetchChartAnalysis, fetchTemperament } from "@/lib/api";
import { saveChart } from "@/lib/storage";
import {
  ASPECT_SYMBOLS,
  DOMICILE_RULERS,
  HARMONIOUS_ASPECTS,
  PLANET_ORDER,
  PLANET_SYMBOLS,
  dignitySummary,
  formatDegree,
  hasTrueDignity,
  housesRuledBy,
  leadAspect,
  naturalList,
} from "@/lib/astro";
import type { SavedChart } from "@/lib/types";

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

function dominantPlanets(paragraph: string): string[] {
  return PLANET_ORDER.map((p) => ({ p, idx: paragraph.indexOf(p) }))
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx)
    .slice(0, 2)
    .map((x) => x.p);
}

export default function AnalysisTab({
  saved,
  userId,
  onUpdate,
}: {
  saved: SavedChart;
  userId: string;
  onUpdate: (chart: SavedChart) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperament, setTemperament] = useState<string | null>(null);

  useEffect(() => {
    if (saved.analysis || loading) return;
    setLoading(true);
    setError(null);
    fetchChartAnalysis(saved.birthData, userId)
      .then(({ analysis }) => {
        const updated = { ...saved, analysis };
        saveChart(updated);
        onUpdate(updated);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not generate this reading."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.id, userId]);

  // The canonical humoral label — same 5-significator calculation the
  // Temperament tab reads, and the single source of truth for it. The AI
  // reading text is never a valid source for this: it's free prose that can
  // (and does) describe the chart using different temperament language than
  // what was actually calculated.
  useEffect(() => {
    let cancelled = false;
    fetchTemperament(saved.birthData)
      .then((r) => {
        if (!cancelled) setTemperament(r.temperament);
      })
      .catch(() => {
        /* Section I falls back to a loading state; not worth a separate error UI here. */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.birthData.date, saved.birthData.time, saved.birthData.latitude, saved.birthData.longitude]);

  const paragraphs = useMemo(() => paragraphsFromAnalysis(saved.analysis), [saved.analysis]);
  const chart = saved.chart;

  const ruler = DOMICILE_RULERS[chart.ascendant.sign];
  const { quote: charQuote, body: charBody } = splitPullQuote(paragraphs[0] ?? "");

  const dominant = useMemo(() => dominantPlanets(paragraphs[1] ?? ""), [paragraphs]);
  const spotlights = useMemo(() => {
    return dominant
      .map((planet) => {
        const pos = chart.planets[planet];
        if (!pos) return null;
        const houses = housesRuledBy(planet, chart.ascendant.sign);
        const housesText = houses.length
          ? `Rules House${houses.length > 1 ? "s" : ""} ${naturalList(houses.map(String))}`
          : "Rules no house from this Ascendant";
        const dignityText = hasTrueDignity(pos.dignities)
          ? `Dignified here by ${naturalList(pos.dignities)}, lending its rulership real strength.`
          : pos.dignities.length
            ? `In ${naturalList(pos.dignities)} here, weakening its rulership.`
            : "Peregrine here, ruling without essential dignity to anchor its authority.";
        return { planet, title: `${planet} in ${pos.sign}, House ${pos.house}`, desc: `${housesText}. ${dignityText}` };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [chart, dominant]);
  const { quote: planetsQuote, body: planetsBody } = splitPullQuote(paragraphs[1] ?? "");

  const dignities = useMemo(() => dignitySummary(chart.planets), [chart]);
  const { quote: dignitiesQuote, body: dignitiesBody } = splitPullQuote(paragraphs[2] ?? "");

  const topAspects = useMemo(() => [...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 5), [chart]);
  const { quote: aspectsQuote, body: aspectsBody } = splitPullQuote(paragraphs[3] ?? "");
  const titleAspect = useMemo(() => leadAspect(aspectsBody, topAspects), [aspectsBody, topAspects]);

  const { quote: synthesisQuote, body: synthesisBody } = splitPullQuote(paragraphs[4] ?? "");

  return (
    <div>
      <div className="section-card">
        <div className="s-eyebrow">
          <span className="n">I</span>
          <span className="n">— Character and Temperament</span>
        </div>
        <h2>{temperament ? `A ${temperament.toLowerCase()} nativity` : "Reading the nativity…"}</h2>
        <div className="fact-strip">
          <div className="fact">
            Sect <b>{chart.sect === "diurnal" ? "Diurnal" : "Nocturnal"}</b>
          </div>
          <div className="fact">
            Ascendant <b>{chart.ascendant.sign}</b>
          </div>
          <div className="fact">
            Ruler{" "}
            <b>
              {chart.ascendant.sign} → {ruler}
            </b>
          </div>
          <div className="fact">
            Temperament <b>{temperament ?? "…"}</b>
          </div>
        </div>
        {loading && !saved.analysis && <p style={{ fontStyle: "italic" }}>The astrologer is casting this reading…</p>}
        {error && !saved.analysis && <p style={{ color: "var(--terracotta)" }}>{error}</p>}
        {charBody && <p>{charBody}</p>}
        {charQuote && <p className="pull">&ldquo;{charQuote}&rdquo;</p>}
      </div>

      <div className="section-card">
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
        {loading && !saved.analysis && <p style={{ fontStyle: "italic" }}>Reading the dominant planets…</p>}
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

      <div className="section-card">
        <div className="s-eyebrow">
          <span className="n">III</span>
          <span className="n">— Essential Dignities</span>
        </div>
        <h2>
          {dignities.dignified.length > 0
            ? `${naturalList(dignities.dignified.map((d) => d.name))} hold${
                dignities.dignified.length === 1 ? "s" : ""
              } essential dignity`
            : "No planet holds essential dignity"}
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
        {dignities.debilitated.map((d) => (
          <div className="aspect-item" key={d.name}>
            <div className="orb">{PLANET_SYMBOLS[d.name] ?? d.name.slice(0, 2)}</div>
            <div>
              <div className="a-title">
                {d.name} — {d.value}
              </div>
              <div className="a-desc">A debility, not a dignity — this weakens rather than strengthens the planet.</div>
            </div>
          </div>
        ))}
        {dignities.peregrine.length > 0 && (
          <div className="aspect-item">
            <div className="orb">—</div>
            <div>
              <div className="a-title">{naturalList(dignities.peregrine)}</div>
              <div className="a-desc">Peregrine — without essential dignity in this chart.</div>
            </div>
          </div>
        )}
      </div>

      <div className="section-card">
        <div className="s-eyebrow">
          <span className="n">IV</span>
          <span className="n">— Key Aspects</span>
        </div>
        <h2>
          {titleAspect
            ? `${titleAspect.planet_a} ${titleAspect.aspect} ${titleAspect.planet_b} anchors the chart`
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
                {HARMONIOUS_ASPECTS.has(a.aspect) ? "A harmonious configuration" : "A challenging configuration"} —{" "}
                {a.aspect}, orb {formatDegree(a.orb)}.
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="s-eyebrow">
          <span className="n">V</span>
          <span className="n">— Hellenistic Lots</span>
        </div>
        <h2>
          Fortune in {chart.lot_of_fortune.sign}, Spirit in {chart.lot_of_spirit.sign}
        </h2>
        <p>
          The Lot of Fortune falls in {chart.lot_of_fortune.sign}, House {chart.lot_of_fortune.house} — indicating
          that material fortune and bodily circumstance flow through the affairs of that house. The Lot of Spirit
          falls in {chart.lot_of_spirit.sign}, House {chart.lot_of_spirit.house} — pointing to where the native&apos;s
          deeds and sense of purpose take shape.
        </p>
      </div>

      <div className="section-card">
        <div className="s-eyebrow">
          <span className="n">VI</span>
          <span className="n">— Synthesis</span>
        </div>
        <h2>According to the Ptolemaic tradition</h2>
        {loading && !saved.analysis && <p style={{ fontStyle: "italic" }}>Weaving the synthesis…</p>}
        {synthesisBody && <p>{synthesisBody}</p>}
        {synthesisQuote && <p className="pull">&ldquo;{synthesisQuote}&rdquo;</p>}
        <div className="go-deeper">
          Every statement above traces back to its source — the Tetrabiblos, Valens&apos; Anthologies — available at a
          touch.
        </div>
      </div>
    </div>
  );
}
