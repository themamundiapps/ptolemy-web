// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCanonicalTemperament } from "./useCanonicalTemperament";
import type { BirthData, TemperamentResult } from "./types";

// This hook is the fix for the 2026-07-28 "the Analysis tab disagreed with
// the Temperament tab" bug class: AnalysisTab and TemperamentTab must read
// a chart's humoral label through the exact same call, not two independent
// ones that merely happen to agree. These tests exercise the hook's own
// request lifecycle in isolation (fetch mocked, real React effects via
// jsdom) -- not the two tabs, which import it directly and inherit these
// guarantees by construction.

const BASE_BIRTH: BirthData = { date: "1990-06-15", time: "14:30", latitude: -25.4284, longitude: -49.2733 };

function result(temperament: string): TemperamentResult {
  return {
    temperament,
    qualities: "Hot & Moist",
    net_heat: 2,
    net_moisture: 1,
    description: "…",
    citation: "Tetrabiblos III",
    factors: [],
  };
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCanonicalTemperament", () => {
  it("starts loading, then resolves with the fetched result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result("Sanguine-Phlegmatic")));
    vi.stubGlobal("fetch", fetchMock);

    const { result: hook } = renderHook(() => useCanonicalTemperament(BASE_BIRTH));
    expect(hook.current.loading).toBe(true);
    expect(hook.current.result).toBeNull();

    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.result?.temperament).toBe("Sanguine-Phlegmatic");
    expect(hook.current.error).toBeNull();
  });

  it("surfaces a failed fetch as an error, never a stale/default result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "boom" }, false));
    vi.stubGlobal("fetch", fetchMock);

    const { result: hook } = renderHook(() => useCanonicalTemperament(BASE_BIRTH));
    await waitFor(() => expect(hook.current.loading).toBe(false));

    expect(hook.current.result).toBeNull();
    expect(hook.current.error).toBe("boom");
  });

  it("refetches when the birth data changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(result("Choleric")))
      .mockResolvedValueOnce(jsonResponse(result("Melancholic")));
    vi.stubGlobal("fetch", fetchMock);

    const { result: hook, rerender } = renderHook(({ birth }) => useCanonicalTemperament(birth), {
      initialProps: { birth: BASE_BIRTH },
    });
    await waitFor(() => expect(hook.current.result?.temperament).toBe("Choleric"));

    rerender({ birth: { ...BASE_BIRTH, date: "1985-01-01" } });
    expect(hook.current.loading).toBe(true);
    await waitFor(() => expect(hook.current.result?.temperament).toBe("Melancholic"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores a slow, now-stale response from a superseded birth date", async () => {
    let resolveFirst!: (r: Response) => void;
    const firstCall = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi.fn().mockReturnValueOnce(firstCall).mockResolvedValueOnce(jsonResponse(result("Phlegmatic")));
    vi.stubGlobal("fetch", fetchMock);

    const { result: hook, rerender } = renderHook(({ birth }) => useCanonicalTemperament(birth), {
      initialProps: { birth: BASE_BIRTH },
    });

    // Change birth data before the first (slow) request resolves.
    rerender({ birth: { ...BASE_BIRTH, date: "1985-01-01" } });
    await waitFor(() => expect(hook.current.result?.temperament).toBe("Phlegmatic"));

    // The first request finally resolves -- must NOT overwrite the second,
    // current birth data's result with the first, stale one.
    await act(async () => {
      resolveFirst(jsonResponse(result("Choleric")));
    });
    expect(hook.current.result?.temperament).toBe("Phlegmatic");
  });
});
