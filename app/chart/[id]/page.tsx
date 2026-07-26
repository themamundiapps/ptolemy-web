"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChartResults from "@/components/ChartResults";
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

  const handleMessagesChange = (messages: ChatMessage[]) => {
    if (!saved) return;
    const updated = { ...saved, messages };
    saveChart(updated);
    setSaved(updated);
  };

  return (
    <div className="min-h-screen bg-parchment">
      <Nav onSignInClick={() => setPaywallOpen(true)} />

      {saved === undefined && (
        <main className="flex min-h-[60vh] items-center justify-center font-cormorant italic text-ink-2">
          Loading…
        </main>
      )}

      {saved === null && (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="font-crimson text-ink">We couldn&apos;t find that chart on this device.</p>
          <Link href="/chart" className="font-ebgaramond text-bronze-dark underline">
            Cast a new chart
          </Link>
        </main>
      )}

      {saved && (
        <main className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-10 text-center">
            <h1 className="font-cinzel text-3xl font-semibold text-ink">
              {saved.birthData.name ? `${saved.birthData.name}'s Chart` : "Your Chart"}
            </h1>
            <p className="mt-2 font-cormorant italic text-ink-2">
              {saved.birthData.date} · {saved.birthData.time} · {saved.birthData.place_name}
            </p>
          </div>

          <ChartResults
            birth={saved.birthData}
            chart={saved.chart}
            analysis={saved.analysis}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            messages={saved.messages}
            onMessagesChange={handleMessagesChange}
            userId={userId}
            onUpgradeClick={() => setPaywallOpen(true)}
          />
        </main>
      )}

      <Footer />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
