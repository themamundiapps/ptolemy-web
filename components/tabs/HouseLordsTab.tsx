"use client";

import { useEffect, useState } from "react";
import { ApiError, fetchHouseLords } from "@/lib/api";
import { dignityLabel } from "@/lib/astro";
import type { BirthData, HouseLordEntry } from "@/lib/types";

export default function HouseLordsTab({ birth }: { birth: BirthData }) {
  const [entries, setEntries] = useState<HouseLordEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchHouseLords(birth)
      .then(({ entries }) => setEntries(entries))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load house lords."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.latitude, birth.longitude]);

  return (
    <div className="data-card">
      <h4>Who rules each house</h4>
      {loading && <p className="empty">Reading the house lords…</p>}
      {error && <p style={{ color: "var(--terracotta)" }}>{error}</p>}
      {entries?.map((entry) => (
        <div className="data-row" key={entry.house_number}>
          <div className="d-label">House {entry.house_number}</div>
          <div className="d-main">
            {entry.sign} → {entry.lord} in {entry.lord_sign}, House {entry.lord_house}
          </div>
          {entry.lord_dignity && <div className="d-tag">{dignityLabel([entry.lord_dignity])}</div>}
        </div>
      ))}
    </div>
  );
}
