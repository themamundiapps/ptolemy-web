"use client";

import { useState } from "react";
import BirthDataForm from "@/components/BirthDataForm";
import { ApiError, fetchSynastry } from "@/lib/api";
import { ASPECT_SYMBOLS, PLANET_SYMBOLS } from "@/lib/astro";
import type { BirthData, SynastryResult } from "@/lib/types";

export default function SynastryTab({ personA, userId }: { personA: BirthData; userId: string }) {
  const [result, setResult] = useState<SynastryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <div className="data-card" style={{ display: "flex", justifyContent: "center" }}>
        <BirthDataForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          title="Compare with another chart"
          submitLabel="Compare charts"
          helperText="Enter the other person's birth details to compare charts."
        />
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
              <div className="d-label">{PLANET_SYMBOLS[o.planet] ?? o.planet.slice(0, 2)}</div>
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
              <div className="d-label">{ASPECT_SYMBOLS[a.aspect] ?? a.aspect}</div>
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
