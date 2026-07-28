"use client";

import { useMemo, useState } from "react";
import { ApiError, fetchElectional } from "@/lib/api";
import { ELECTIONAL_THEMES, type ElectionalTheme } from "@/lib/electionalThemes";
import {
  formatDayHeading,
  groupHits,
  humanizedTimeOfDay,
  notCountedReason,
  qualityIndicatorFor,
  favorableRulerFor,
  type GroupedHit,
} from "@/lib/electionalHelpers";
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

function HitRow({ grouped, showReason }: { grouped: GroupedHit; showReason?: boolean }) {
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
        {showReason && <div className="elect-not-counted-reason">{notCountedReason(grouped)}</div>}
      </div>
      <div className="elect-hit-meta">
        <span className="elect-mode">{modeLabel}</span>
        {indicator && (
          <span
            className={`elect-indicator ${indicator === "★" ? "star" : "warn"}`}
            title={indicator === "★" ? "Benefic in a harmonious aspect" : "Tense aspect (square or opposition)"}
          >
            {indicator}
          </span>
        )}
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

  // Grouped once over the full hit list, then split by supportKind -- not
  // filtered into two lists *before* grouping, which used to be able to
  // split a direct+antiscion pair on the same (planet, house) across both
  // buckets instead of merging them into one row (see Problem 4).
  const grouped = useMemo(() => groupHits(day.hits), [day.hits]);
  const supporting = useMemo(() => grouped.filter((g) => g.supportKind === "direct"), [grouped]);
  const antiscionOnly = useMemo(() => grouped.filter((g) => g.supportKind === "antiscion"), [grouped]);
  const notCounted = useMemo(() => grouped.filter((g) => g.supportKind === "none"), [grouped]);

  return (
    <div className="data-card">
      <h4>
        <span style={{ color: "var(--bronze-deep)", marginRight: 8 }}>{rank}</span>
        {formatDayHeading(day.date)}
      </h4>
      <p className="elect-meta">
        Best time: {day.best_time} <span className="elect-time-qualitative">({humanizedTimeOfDay(day.best_time)})</span>
      </p>
      {rulerPlanet && (
        <p className="elect-ruler">
          {PLANET_SYMBOLS[rulerPlanet] ?? ""} Ruled by {rulerPlanet}
        </p>
      )}
      <p className="elect-quality">
        {symbol} {day.quality_label}
      </p>

      {day.caution && <p className="elect-caution">{day.caution}</p>}

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
          {antiscionOnly.length > 0 && (
            <>
              <span className="elect-details-label">Antiscion support</span>
              <p className="elect-antiscion-note">
                These only form through antiscion, a mirrored reflection point rather than the planet&apos;s true
                position — a legitimate traditional technique, but secondary: it never moves this day&apos;s rating
                on its own.
              </p>
              {antiscionOnly.map((g, i) => (
                <HitRow key={i} grouped={g} />
              ))}
            </>
          )}
          {notCounted.length > 0 && (
            <>
              <span className="elect-details-label">Present but not counted</span>
              {notCounted.map((g, i) => (
                <HitRow key={i} grouped={g} showReason />
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
        <div className="go-deeper">
          Each day in your range is checked against a traditional three-tier checklist, not a single averaged score:
          essential conditions that must all hold for a day to be usable at all, at least one supporting aspect to
          call it Favorable, and desirable extras — a waxing Moon, a benefic day-ruler — that lift it to Auspicious.
          After the electional method of the Hellenistic and medieval tradition.
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
    // banner and note are never both worth showing: banner only fires when
    // a theme's essential-direct planet (Venus for Love, Mercury for
    // Travel/Business) is retrograde on every single scanned day, which
    // means every day already fails the essential retrograde check and
    // note is left as the generic "no favorable configurations" fallback —
    // banner names the actual planet and gives theme-specific guidance, so
    // it's strictly more informative whenever both are present.
    const notice = result.banner ?? result.note;
    return (
      <div>
        <div className="elect-results-header">
          <h4>
            Best Moments for {result.theme_label}
            <span style={{ float: "right" }}>
              <button type="button" className="btn-link" onClick={() => setStep("range")}>
                ← New search
              </button>
            </span>
          </h4>
        </div>
        {notice && (
          <div className="data-card">
            <p style={{ color: "var(--ink-soft)" }}>{notice}</p>
          </div>
        )}
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
