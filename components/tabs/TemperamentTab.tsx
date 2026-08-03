"use client";

import { useEffect, useState } from "react";
import { fetchTemperamentExpanded } from "@/lib/api";
import { useCanonicalTemperament } from "@/lib/useCanonicalTemperament";
import type { BirthData, TemperamentExpandedResult } from "@/lib/types";

/** Renders "**Label:** body" paragraphs (as produced by the backend content
 * parser) with the label as a small caps sub-header above its body text,
 * rather than as one undifferentiated block of prose. */
function RecommendationsBody({ text }: { text: string }) {
  const labelPattern = /^\*\*(.+?):\*\*\s*([\s\S]*)$/;
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        const match = paragraph.match(labelPattern);
        if (!match) {
          return (
            <p className="recommendation-body" key={i}>
              {paragraph}
            </p>
          );
        }
        return (
          <div key={i} className="recommendation-body">
            <span className="recommendation-label">{match[1]}</span>
            {match[2]}
          </div>
        );
      })}
    </>
  );
}

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
  const { result, loading, error } = useCanonicalTemperament(birth);
  const [expanded, setExpanded] = useState<TemperamentExpandedResult | null>(null);

  // Keyed off the resolved temperament name, so it's only fetched once the
  // base calculation returns -- never fetched independently, which would
  // risk racing ahead with a stale or guessed name.
  useEffect(() => {
    if (!result) {
      setExpanded(null);
      return;
    }
    let cancelled = false;
    fetchTemperamentExpanded(result.temperament)
      .then((r) => {
        if (!cancelled) setExpanded(r);
      })
      .catch(() => {
        // Fails gracefully: no expanded content isn't worth surfacing as an
        // error, the rest of the tab is already usable.
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

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
        <p style={{ fontSize: "var(--text-body-size)", fontWeight: "var(--text-body-weight)", lineHeight: "var(--text-body-line)", color: "var(--ink-soft)" }}>
          {result.description}
        </p>
        <p style={{ fontSize: "var(--text-secondary-size)", color: "var(--bronze-deep)", marginTop: 14 }}>
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

      {expanded && (
        <div className="data-card">
          <h4>Health Tendencies</h4>
          <p style={{ fontSize: "var(--text-body-size)", fontWeight: "var(--text-body-weight)", lineHeight: "var(--text-body-line)", color: "var(--ink-soft)" }}>
            {expanded.health_tendencies.text}
          </p>
          {expanded.health_tendencies.citation && (
            <p style={{ fontSize: "var(--text-secondary-size)", color: "var(--bronze-deep)", marginTop: 14 }}>
              {expanded.health_tendencies.citation}
            </p>
          )}
        </div>
      )}

      {expanded && (
        <div className="data-card">
          <h4>
            Traditional Recommendations
            <span className="pro-badge">PRO</span>
          </h4>
          <RecommendationsBody text={expanded.traditional_recommendations.text} />
        </div>
      )}
    </div>
  );
}
