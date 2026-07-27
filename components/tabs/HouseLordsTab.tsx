"use client";

import { useEffect, useState } from "react";
import DetailModal, { ModalSection } from "@/components/DetailModal";
import { ApiError, fetchHouseLordInterpretation, fetchHouseLords } from "@/lib/api";
import { dignityLabel } from "@/lib/astro";
import type { BirthData, HouseLordEntry, Interpretation } from "@/lib/types";

export default function HouseLordsTab({ birth }: { birth: BirthData }) {
  const [entries, setEntries] = useState<HouseLordEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<HouseLordEntry | null>(null);
  const [interp, setInterp] = useState<Interpretation | null>(null);
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchHouseLords(birth)
      .then(({ entries }) => setEntries(entries))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load house lords."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birth.date, birth.time, birth.latitude, birth.longitude]);

  const openEntry = (entry: HouseLordEntry) => {
    setActive(entry);
    setInterp(null);
    setInterpError(null);
    setInterpLoading(true);
    fetchHouseLordInterpretation(entry.house_number, entry.lord_house)
      .then(setInterp)
      .catch((e) => setInterpError(e instanceof ApiError ? e.message : "Could not load this interpretation."))
      .finally(() => setInterpLoading(false));
  };

  return (
    <div className="data-card">
      <h4>Who rules each house</h4>
      {loading && <p className="empty">Reading the house lords…</p>}
      {error && <p style={{ color: "var(--terracotta)" }}>{error}</p>}
      {entries?.map((entry) => (
        <button type="button" className="data-row" key={entry.house_number} onClick={() => openEntry(entry)}>
          <div className="d-label">House {entry.house_number}</div>
          <div className="d-main">
            {entry.sign} → {entry.lord} in {entry.lord_sign}, House {entry.lord_house}
          </div>
          {entry.lord_dignity && <div className="d-tag">{dignityLabel([entry.lord_dignity])}</div>}
        </button>
      ))}

      {active && (
        <DetailModal
          title={`House ${active.house_number} → House ${active.lord_house}`}
          onClose={() => setActive(null)}
        >
          {interpLoading && <p>Reading the doctrine…</p>}
          {interpError && <p style={{ color: "var(--terracotta)" }}>{interpError}</p>}
          {interp && <ModalSection body={interp.body} citation={interp.citation || undefined} />}
        </DetailModal>
      )}
    </div>
  );
}
