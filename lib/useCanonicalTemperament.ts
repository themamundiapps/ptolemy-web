"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchTemperament } from "./api";
import type { BirthData, TemperamentResult } from "./types";

export interface CanonicalTemperament {
  result: TemperamentResult | null;
  loading: boolean;
  error: string | null;
}

/** The single call site for /temperament -- both TemperamentTab and
 * AnalysisTab's Section I read a chart's humoral label through this hook,
 * so the two tabs can never independently drift on what a chart's
 * temperament is. Before this, each tab called fetchTemperament() on its
 * own: the "the label agrees between both tabs" invariant held only because
 * the two call sites happened to match, not because there was one source of
 * truth -- see the 2026-07-28 fix that made AnalysisTab consult the real
 * calculation instead of regex-extracting a temperament word out of the AI
 * reading's free prose. This hook is what makes that invariant structural
 * rather than incidental. */
export function useCanonicalTemperament(birth: BirthData): CanonicalTemperament {
  const [result, setResult] = useState<TemperamentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTemperament(birth)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Could not read your temperament.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.latitude, birth.longitude]);

  return { result, loading, error };
}
