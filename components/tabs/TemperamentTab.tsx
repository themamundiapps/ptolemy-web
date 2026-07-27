"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchTemperament } from "@/lib/api";
import type { BirthData, TemperamentResult } from "@/lib/types";

function QualityBar({ leftLabel, rightLabel, value }: { leftLabel: string; rightLabel: string; value: number }) {
  const fraction = Math.max(-1, Math.min(1, value / 6));
  const position = ((fraction + 1) / 2) * 100;
  return (
    <div className="quality-bar">
      <div className="track">
        <div className="line" />
        <div className="mid" />
        <div className="marker" style={{ left: `${position}%` }} />
      </div>
      <div className="labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export default function TemperamentTab({ birth }: { birth: BirthData }) {
  const [result, setResult] = useState<TemperamentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTemperament(birth)
      .then(setResult)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not read your temperament."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.latitude, birth.longitude]);

  if (loading) {
    return (
      <div className="data-card">
        <p className="empty">Weighing the humours…</p>
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
  if (!result) return null;

  return (
    <div>
      <div className="data-card">
        <h4>{result.temperament}</h4>
        <p style={{ color: "var(--ink-soft)", marginBottom: 4 }}>{result.qualities}</p>
        <QualityBar leftLabel="Cold" rightLabel="Hot" value={result.net_heat} />
        <QualityBar leftLabel="Dry" rightLabel="Moist" value={result.net_moisture} />
      </div>

      <div className="data-card">
        <h4>Analysis</h4>
        <p style={{ fontSize: ".95rem", lineHeight: 1.7, color: "var(--ink-soft)" }}>{result.description}</p>
        <p style={{ fontStyle: "italic", fontSize: ".85rem", color: "var(--bronze-deep)", marginTop: 14 }}>
          {result.citation}
        </p>
      </div>

      <div className="data-card">
        <h4>Contributing Factors</h4>
        {result.factors.map((f) => (
          <div className="data-row" key={f.label}>
            <div className="d-label">{f.label}</div>
            <div className="d-main">{f.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
