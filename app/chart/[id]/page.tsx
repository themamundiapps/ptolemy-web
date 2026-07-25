"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChartWheel from "@/components/ChartWheel";
import PlanetList from "@/components/PlanetList";
import ChatPanel from "@/components/ChatPanel";
import PaywallModal from "@/components/PaywallModal";
import { ApiError, fetchChartAnalysis } from "@/lib/api";
import { getChart, getOrCreateDeviceId, saveChart } from "@/lib/storage";
import { getGoogleUser } from "@/lib/auth";
import type { ChatMessage, SavedChart } from "@/lib/types";

export default function ChartResultsPage() {
  const params = useParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedChart | null | undefined>(undefined);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(getGoogleUser()?.id ?? getOrCreateDeviceId());
    setSaved(getChart(params.id));
  }, [params.id]);

  useEffect(() => {
    if (!saved || saved.analysis || analysisLoading) return;
    setAnalysisLoading(true);
    fetchChartAnalysis(saved.birthData, userId)
      .then(({ analysis }) => {
        const updated = { ...saved, analysis };
        saveChart(updated);
        setSaved(updated);
      })
      .catch((e) => setAnalysisError(e instanceof ApiError ? e.message : "Could not generate a reading."))
      .finally(() => setAnalysisLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.id, userId]);

  if (saved === undefined) {
    return <main className="flex min-h-screen items-center justify-center text-muted">Loading…</main>;
  }

  if (saved === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-ink">We couldn&apos;t find that chart on this device.</p>
        <Link href="/chart" className="text-gold underline">
          Cast a new chart
        </Link>
      </main>
    );
  }

  const handleMessagesChange = (messages: ChatMessage[]) => {
    const updated = { ...saved, messages };
    saveChart(updated);
    setSaved(updated);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl text-ink">
          {saved.birthData.name ? `${saved.birthData.name}'s Chart` : "Your Chart"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {saved.birthData.date} · {saved.birthData.time} · {saved.birthData.place_name}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <ChartWheel chart={saved.chart} />
          <PlanetList chart={saved.chart} />
          <div>
            <h2 className="font-serif text-xl text-gold">Reading</h2>
            {analysisLoading && <p className="mt-2 text-sm text-muted">Casting your reading…</p>}
            {analysisError && <p className="mt-2 text-sm text-red-400">{analysisError}</p>}
            {saved.analysis && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{saved.analysis}</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-serif text-xl text-gold">Ask the Astrologer</h2>
          <ChatPanel
            birth={saved.birthData}
            userId={userId}
            messages={saved.messages}
            onMessagesChange={handleMessagesChange}
            onUpgradeClick={() => setPaywallOpen(true)}
          />
        </div>
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </main>
  );
}
