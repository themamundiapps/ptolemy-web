"use client";

import { useEffect, useState } from "react";
import BirthDataForm from "@/components/BirthDataForm";
import { ApiError, fetchSynastry } from "@/lib/api";
import { AstroGlyph, ASPECT_GLYPH, PLANET_GLYPH } from "@/components/AstroGlyphs";
import { listCharts } from "@/lib/storage";
import type { BirthData, SavedChart, SynastryResult } from "@/lib/types";

export default function SynastryTab({
  personA,
  userId,
  currentChartId,
}: {
  personA: BirthData;
  userId: string;
  currentChartId?: string;
}) {
  const [result, setResult] = useState<SynastryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherCharts, setOtherCharts] = useState<SavedChart[]>([]);
  const [showManual, setShowManual] = useState(false);

  // Read from localStorage after mount only -- listCharts() returns [] during
  // SSR (no window), so reading it at render time would mismatch the client's
  // first render and trip a hydration warning.
  useEffect(() => {
    setOtherCharts(listCharts().filter((c) => c.id !== currentChartId));
  }, [currentChartId]);

  const handleSubmit = async (personB: BirthData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSynastry(
        {
          name: personA.name || "You",
          date: personA.date,
          time: personA.time,
          latitude: personA.latitude,
          longitude: personA.longitude,
          tz_offset: personA.tz_offset,
        },
        {
          name: personB.name || "Partner",
          date: personB.date,
          time: personB.time,
          latitude: personB.latitude,
          longitude: personB.longitude,
          tz_offset: personB.tz_offset,
        },
        userId,
      );
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not compare these charts.");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    const hasSaved = otherCharts.length > 0;
    return (
      <div className="synastry-layout">
        <div className="synastry-intro md">
          <h4>What synastry delivers</h4>
          <p>
            Two nativities read against each other by the same traditional method as the rest of Ptolemy — no
            generic compatibility score.
          </p>
          <ul>
            <li>Inter-aspects between both charts, with orbs</li>
            <li>House overlay — where each person&apos;s planets land in the other&apos;s houses</li>
            <li>A full written reading, source-grounded like every chart in Ptolemy</li>
          </ul>
        </div>
        <div>
          {hasSaved && (
            <div className="data-card">
              <h4>Compare with a saved chart</h4>
              {otherCharts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="data-row"
                  disabled={loading}
                  onClick={() => handleSubmit(c.birthData)}
                >
                  <div className="d-label">○</div>
                  <div className="d-main">{c.birthData.name || "Untitled chart"}</div>
                  <div className="d-tag">{c.birthData.date}</div>
                </button>
              ))}
              {error && <p style={{ color: "var(--terracotta)", marginTop: 10 }}>{error}</p>}
              <button type="button" className="btn-link" style={{ marginTop: 14 }} onClick={() => setShowManual((v) => !v)}>
                {showManual ? "Hide manual entry" : "or enter details manually"}
              </button>
            </div>
          )}
          {(!hasSaved || showManual) && (
            <div style={{ display: "flex", justifyContent: hasSaved ? "flex-start" : "center", marginTop: hasSaved ? 20 : 0 }}>
              <BirthDataForm
                onSubmit={handleSubmit}
                loading={loading}
                error={hasSaved ? null : error}
                title="Compare with another chart"
                submitLabel="Compare charts"
                helperText="Enter the other person's birth details to compare charts."
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="data-card">
        <h4>
          {result.person_a_name} &amp; {result.person_b_name}
          <button type="button" className="btn-link" style={{ float: "right" }} onClick={() => setResult(null)}>
            ← New comparison
          </button>
        </h4>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>{result.analysis}</p>
      </div>

      <div className="data-card">
        <h4>House Overlays</h4>
        {result.house_overlays.map((o, i) => {
          const name = o.from_chart === "A" ? result.person_a_name : result.person_b_name;
          return (
            <div className="data-row" key={i}>
              <div className="d-label">
                {PLANET_GLYPH[o.planet] ? <AstroGlyph name={PLANET_GLYPH[o.planet]} size={14} /> : o.planet.slice(0, 2)}
              </div>
              <div className="d-main">
                {name}&apos;s {o.planet} in {o.sign} falls in House {o.house}
              </div>
            </div>
          );
        })}
      </div>

      <div className="data-card">
        <h4>Inter-Aspects</h4>
        {result.aspects.length === 0 && <p className="empty">No major inter-aspects within orb.</p>}
        {result.aspects.map((a, i) => {
          const aName = a.from_chart === "A" ? result.person_a_name : result.person_b_name;
          const bName = a.from_chart === "A" ? result.person_b_name : result.person_a_name;
          return (
            <div className="data-row" key={i}>
              <div className="d-label">
                {ASPECT_GLYPH[a.aspect] ? <AstroGlyph name={ASPECT_GLYPH[a.aspect]} size={14} title={a.aspect} /> : a.aspect}
              </div>
              <div className="d-main">
                {aName}&apos;s {a.planet_a} {a.aspect} {bName}&apos;s {a.planet_b}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
