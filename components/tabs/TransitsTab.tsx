"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchTransits } from "@/lib/api";
import { formatDegree } from "@/lib/astro";
import { AstroGlyph, PLANET_GLYPH } from "@/components/AstroGlyphs";
import type { BirthData, TransitsResponse } from "@/lib/types";

function moonPhaseWord(phaseName: string, phaseAngle: number): string {
  const lower = phaseName.toLowerCase();
  if (lower.includes("waxing")) return "waxing";
  if (lower.includes("waning")) return "waning";
  return phaseAngle < 180 ? "waxing" : "waning";
}

export default function TransitsTab({ birth }: { birth: BirthData }) {
  const [transits, setTransits] = useState<TransitsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTransits(birth)
      .then(setTransits)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not read today's sky."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.latitude, birth.longitude]);

  if (loading) {
    return (
      <div className="data-card">
        <p className="empty">Reading the sky…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="data-card">
        <p style={{ color: "var(--terracotta)" }}>{error}</p>
      </div>
    );
  }
  if (!transits) return null;

  const sorted = [...transits.transits].sort((a, b) => a.orb - b.orb);

  return (
    <div>
      <div className="data-card">
        <h4>The Moon Right Now</h4>
        <div className="data-row">
          <div className="d-label">
            <AstroGlyph name={PLANET_GLYPH.Moon} size={14} />
          </div>
          <div className="d-main">
            Moon in {transits.moon_position.sign}, House {transits.moon_position.house} —{" "}
            {moonPhaseWord(transits.moon_position.phase_name, transits.moon_position.phase_angle)} (
            {transits.moon_position.phase_name})
          </div>
        </div>
        <div className="moon-state-row">
          <span className={`moon-state-badge${transits.moon_position.voc ? " active" : ""}`}>
            {transits.moon_position.voc ? "Void of course" : "Not void of course"}
          </span>
          <span className={`moon-state-badge${transits.moon_position.via_combusta ? " active" : ""}`}>
            {transits.moon_position.via_combusta ? "Via combusta" : "Not via combusta"}
          </span>
        </div>
        {transits.moon_natal_aspect && (
          <div className="data-row">
            <div className="d-label">
              <AstroGlyph name={PLANET_GLYPH[transits.moon_natal_aspect.natal_planet] ?? "moon"} size={14} />
            </div>
            <div className="d-main">
              {transits.moon_natal_aspect.is_applying ? "Applying" : "Separating"} {transits.moon_natal_aspect.aspect}{" "}
              to natal {transits.moon_natal_aspect.natal_planet}
            </div>
            <div className="d-tag">{formatDegree(transits.moon_natal_aspect.orb)}</div>
          </div>
        )}
        <div className="go-deeper">
          The Moon is the axis of every electional reading below — void of course here uses the strict, classical
          definition (Lilly): she must complete an aspect with another planet before leaving her current sign.
          Some other software uses a more permissive definition that also counts an aspect completing after a sign
          change; Ptolemy deliberately doesn&apos;t.
        </div>
      </div>

      <div className="data-card">
        <h4>Active Transits</h4>
        {sorted.length === 0 && <p className="empty">No major transiting aspects within orb right now.</p>}
        {sorted.map((t, i) => (
          <div className="data-row" key={i}>
            <div className="d-label">
              {PLANET_GLYPH[t.transiting_planet] ? (
                <AstroGlyph name={PLANET_GLYPH[t.transiting_planet]} size={14} />
              ) : (
                t.transiting_planet.slice(0, 2)
              )}
            </div>
            <div className="d-main">
              Transiting {t.transiting_planet} {t.aspect} natal {t.natal_planet}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "var(--text-secondary-size)",
                  color: t.is_harmonious ? "var(--bronze-deep)" : "var(--terracotta)",
                }}
              >
                {t.is_applying ? "applying" : "separating"} · {t.is_harmonious ? "favorable" : "caution"}
              </span>
            </div>
            <div className="d-tag">{formatDegree(t.orb)}</div>
          </div>
        ))}
        <div className="go-deeper">
          Calculated live against your natal chart, using the same Ptolemaic orbs and whole-sign houses as the rest
          of your reading — not a generic daily horoscope.
        </div>
      </div>
    </div>
  );
}
