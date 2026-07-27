"use client";

import { useMemo, useState } from "react";
import { ApiError, fetchElectional } from "@/lib/api";
import { ELECTIONAL_THEMES, type ElectionalTheme } from "@/lib/electionalThemes";
import { formatDayHeading, groupHits, humanizedTimeOfDay, qualityIndicatorFor, favorableRulerFor, type GroupedHit } from "@/lib/electionalHelpers";
import { buildContextualAwareness, buildSynthesis, QUALITATIVE_SYMBOLS } from "@/lib/electionalSynthesis";
import { ASPECT_SYMBOLS, PLANET_SYMBOLS } from "@/lib/astro";
import type { BirthData, ElectionalDay, ElectionalResult } from "@/lib/types";

type Step = "theme" | "range" | "results";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDateToLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function HitRow({ grouped }: { grouped: GroupedHit }) {
  const { hit, modeLabel, isCazimi } = grouped;
  const symbol = ASPECT_SYMBOLS[hit.aspect] ?? hit.aspect;
  const subject = hit.planet === "Sun" || hit.planet === "Moon" ? `The ${hit.planet}` : hit.planet;
  const article = "aeiou".includes(hit.aspect[0]?.toLowerCase() ?? "") ? "an" : "a";
  const indicator = qualityIndicatorFor(hit);

  return (
    <div className="elect-hit-row">
      <div className="elect-hit-text">
        {isCazimi && <span className="elect-cazimi-badge">Cazimi</span>}
        {subject} forms {article} {hit.aspect} ({symbol}) with your House {hit.house} — {hit.house_name}
        {isCazimi && (
          <div className="elect-cazimi-note">
            This planet is in the heart of the Sun — an exceptionally empowering condition in traditional astrology.
          </div>
        )}
      </div>
      <div className="elect-hit-meta">
        <span className="elect-mode">{modeLabel}</span>
        {indicator && <span className={`elect-indicator ${indicator === "★" ? "star" : "warn"}`}>{indicator}</span>}
      </div>
    </div>
  );
}

function DayCard({
  rank,
  day,
  themeKey,
  synthesis,
  contextLine,
}: {
  rank: number;
  day: ElectionalDay;
  themeKey: string;
  synthesis: string;
  contextLine: string | null;
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const rulerPlanet = useMemo(() => favorableRulerFor(themeKey, isoDateToLocalDate(day.date)), [themeKey, day.date]);
  const symbol = QUALITATIVE_SYMBOLS[day.quality_label] ?? "";

  const supporting = useMemo(() => groupHits(day.hits.filter((h) => h.is_supporting)), [day.hits]);
  const notCounted = useMemo(() => groupHits(day.hits.filter((h) => !h.is_supporting)), [day.hits]);

  return (
    <div className="data-card">
      <h4>
        <span style={{ color: "var(--bronze-deep)", marginRight: 8 }}>{rank}</span>
        {formatDayHeading(day.date)}
      </h4>
      <p className="elect-meta">Best time: {humanizedTimeOfDay(day.best_time)}</p>
      {rulerPlanet && (
        <p className="elect-ruler">
          {PLANET_SYMBOLS[rulerPlanet] ?? ""} Ruled by {rulerPlanet}
        </p>
      )}
      <p className="elect-quality">
        {symbol} {day.quality_label}
      </p>

      {day.reasons.length > 0 && (
        <ul className="elect-reasons">
          {day.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}

      <p className="elect-synthesis">{synthesis}</p>
      {contextLine && <p className="elect-context">{contextLine}</p>}

      <button type="button" className="btn-link" onClick={() => setDetailsExpanded((v) => !v)}>
        Planetary details {detailsExpanded ? "▲" : "▼"}
      </button>

      {detailsExpanded && (
        <div className="elect-details">
          {supporting.length > 0 && (
            <>
              <span className="elect-details-label">Supporting aspects</span>
              {supporting.map((g, i) => (
                <HitRow key={i} grouped={g} />
              ))}
            </>
          )}
          {notCounted.length > 0 && (
            <>
              <span className="elect-details-label">Present but not counted</span>
              {notCounted.map((g, i) => (
                <HitRow key={i} grouped={g} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ElectionalTab({ birth }: { birth: BirthData }) {
  const [step, setStep] = useState<Step>("theme");
  const [theme, setTheme] = useState<ElectionalTheme | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(addDaysIso(14));
  const [result, setResult] = useState<ElectionalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { syntheses, contextLines } = useMemo(() => {
    if (!result) return { syntheses: [] as string[], contextLines: [] as (string | null)[] };
    const usageCounts = new Map<string, number>();
    return {
      syntheses: result.days.map((day) => buildSynthesis(day.hits, day.quality_label, usageCounts)),
      contextLines: result.days.map((day) => buildContextualAwareness(day.hits, day.quality_label)),
    };
  }, [result]);

  const handleScan = async () => {
    if (!theme) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchElectional(birth, startDate, endDate, theme.key);
      setResult(res);
      setStep("results");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not scan for good moments.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "theme") {
    return (
      <div className="data-card">
        <h4>Find your best moment</h4>
        <div className="theme-grid">
          {ELECTIONAL_THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              className="theme-tile"
              onClick={() => {
                setTheme(t);
                setResult(null);
                setStep("range");
              }}
            >
              {t.pro && <span className="pro">PRO</span>}
              <span className="t-name">{t.label}</span>
              <span className="t-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "range" && theme) {
    return (
      <div className="data-card">
        <h4>{theme.label}</h4>
        <p style={{ color: "var(--ink-soft)", marginBottom: 16 }}>{theme.description}</p>
        <div className="field-row">
          <div className="field">
            <label>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {error && <p style={{ color: "var(--terracotta)", marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button type="button" className="btn-primary" onClick={handleScan} disabled={loading}>
            {loading ? "Scanning…" : "Scan for Good Moments"}
          </button>
          <button type="button" className="btn-link" onClick={() => setStep("theme")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "results" && result && theme) {
    return (
      <div>
        <div className="data-card">
          <h4>
            Best Moments for {result.theme_label}
            <span style={{ float: "right" }}>
              <button type="button" className="btn-link" onClick={() => setStep("range")}>
                ← New search
              </button>
            </span>
          </h4>
          {result.note && <p style={{ color: "var(--ink-soft)" }}>{result.note}</p>}
        </div>
        {result.days.length === 0 && (
          <div className="data-card">
            <p className="empty">No auspicious moments found in this window. Try a wider date range.</p>
          </div>
        )}
        {result.days.map((day, i) => (
          <DayCard
            key={day.date}
            rank={i + 1}
            day={day}
            themeKey={theme.key}
            synthesis={syntheses[i]}
            contextLine={contextLines[i]}
          />
        ))}
      </div>
    );
  }

  return null;
}
