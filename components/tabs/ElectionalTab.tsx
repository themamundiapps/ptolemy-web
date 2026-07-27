"use client";

import { useState } from "react";
import { ApiError, fetchElectional } from "@/lib/api";
import { ELECTIONAL_THEMES, type ElectionalTheme } from "@/lib/electionalThemes";
import type { BirthData, ElectionalResult } from "@/lib/types";

type Step = "theme" | "range" | "results";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ElectionalTab({ birth }: { birth: BirthData }) {
  const [step, setStep] = useState<Step>("theme");
  const [theme, setTheme] = useState<ElectionalTheme | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(addDaysIso(14));
  const [result, setResult] = useState<ElectionalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (step === "results" && result) {
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
        {result.days.map((day) => (
          <div className="data-card" key={day.date}>
            <h4>
              {day.date} · {day.best_time}
              <span style={{ float: "right", fontSize: ".78rem", color: "var(--bronze-deep)" }}>
                {day.quality_label}
              </span>
            </h4>
            <ul
              style={{
                paddingLeft: 18,
                margin: 0,
                color: "var(--ink-soft)",
                fontSize: ".92rem",
                lineHeight: 1.6,
              }}
            >
              {day.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
