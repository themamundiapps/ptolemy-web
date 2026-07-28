"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import Sidebar from "@/components/Sidebar";
import ChatDock from "@/components/ChatDock";
import ChartTab from "@/components/tabs/ChartTab";
import HouseLordsTab from "@/components/tabs/HouseLordsTab";
import TemperamentTab from "@/components/tabs/TemperamentTab";
import ElectionalTab from "@/components/tabs/ElectionalTab";
import TransitsTab from "@/components/tabs/TransitsTab";
import SynastryTab from "@/components/tabs/SynastryTab";
import AnalysisTab from "@/components/tabs/AnalysisTab";
import { getGoogleUser } from "@/lib/auth";
import { FREE_MESSAGE_LIMIT, getChart, getOrCreateDeviceId, saveChart, totalUserMessageCount } from "@/lib/storage";
import { DEFAULT_TAB, isTabKey, type TabKey } from "@/lib/tabs";
import type { ChatMessage, SavedChart } from "@/lib/types";

const TAB_META: Record<TabKey, { title: string; subtitle: string }> = {
  chart: { title: "Chart", subtitle: "Wheel, planets, lots and aspects" },
  "house-lords": { title: "House Lords", subtitle: "Who rules each house, and where they land" },
  temperament: { title: "Temperament", subtitle: "Humoral complexion from Tetrabiblos III" },
  electional: { title: "Electional", subtitle: "Choose the best moment by essential criteria" },
  transits: { title: "Transits", subtitle: "Today's active transits to your natal chart" },
  synastry: { title: "Synastry", subtitle: "Compare your chart with another" },
  analysis: { title: "Analysis", subtitle: "A full reading of the nativity" },
  ask: { title: "Chat with the Astrologer", subtitle: "Chat about your chart" },
};

function ReadingPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [saved, setSaved] = useState<SavedChart | null | undefined>(undefined);
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState<TabKey>(DEFAULT_TAB);
  const [remaining, setRemaining] = useState(FREE_MESSAGE_LIMIT);
  const [initialQuestion, setInitialQuestion] = useState("");
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // The full "A Reading of the Nativity" header runs ~250px tall -- fine at
  // the top of the page, but it pushed every tab's actual content below the
  // fold on every visit. Collapses to a compact name+sect bar once scrolled
  // past, expands back at the top.
  useEffect(() => {
    const onScroll = () => setHeaderCollapsed(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUserId(getGoogleUser()?.id ?? getOrCreateDeviceId());
    setSaved(getChart(params.id));
  }, [params.id]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (isTabKey(requested)) setTab(requested);
  }, [searchParams]);

  // Consumes a one-time ?q= carried over from the Hub's "Ask the Astrologer"
  // banner, then strips it from the URL so revisiting the Ask tab later
  // doesn't keep re-populating the input with a stale question.
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    setInitialQuestion(q);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("q");
    router.replace(`/reading/${params.id}?${next.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRemaining(Math.max(FREE_MESSAGE_LIMIT - totalUserMessageCount(), 0));
  }, [saved?.messages]);

  const handleSelectTab = (key: TabKey) => {
    setTab(key);
    if (saved) router.replace(`/reading/${saved.id}?tab=${key}`, { scroll: false });
  };

  const handleMessagesChange = (messages: ChatMessage[]) => {
    if (!saved) return;
    const updated = { ...saved, messages };
    saveChart(updated);
    setSaved(updated);
  };

  if (saved === undefined) {
    return (
      <div className="pt-app min-h-screen">
        <AppNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (saved === null) {
    return (
      <div className="pt-app min-h-screen">
        <AppNav />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p>We couldn&apos;t find that chart on this device.</p>
          <Link href="/chart" style={{ color: "var(--bronze-deep)" }}>
            Cast a new chart
          </Link>
        </div>
      </div>
    );
  }

  const meta = TAB_META[tab];

  return (
    <div className="pt-app min-h-screen">
      <AppNav />

      <div className="app-shell">
        <Sidebar active={tab} onSelect={handleSelectTab} />
        <main className="app-main">
          <div className={`read-header${headerCollapsed ? " is-collapsed" : ""}`}>
            <div className="eyebrow">A Reading of the Nativity</div>
            <h1>{saved.birthData.name ? `The Chart of ${saved.birthData.name}` : "Your Chart"}</h1>
            <div className="meta">
              {saved.birthData.date} · {saved.birthData.time} · {saved.birthData.place_name}
            </div>
            <span className="sect-badge">
              {saved.chart.sect === "diurnal" ? "Diurnal" : "Nocturnal"} Sect · {saved.chart.ascendant.sign} Ascendant
            </span>
          </div>
          <div className="tab-header">
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
          <div className="tab-body">
            {tab === "chart" && <ChartTab chart={saved.chart} />}
            {tab === "house-lords" && <HouseLordsTab birth={saved.birthData} />}
            {tab === "temperament" && <TemperamentTab birth={saved.birthData} />}
            {tab === "electional" && <ElectionalTab birth={saved.birthData} />}
            {tab === "transits" && <TransitsTab birth={saved.birthData} />}
            {tab === "synastry" && <SynastryTab personA={saved.birthData} userId={userId} />}
            {tab === "analysis" && <AnalysisTab saved={saved} userId={userId} onUpdate={setSaved} />}
            {tab === "ask" && (
              <ChatDock
                birth={saved.birthData}
                userId={userId}
                messages={saved.messages}
                onMessagesChange={handleMessagesChange}
                remaining={remaining}
                initialInput={initialQuestion}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense>
      <ReadingPageInner />
    </Suspense>
  );
}
