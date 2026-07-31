"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PaywallModal from "@/components/PaywallModal";
import BirthDataForm from "@/components/BirthDataForm";
import { ApiError, fetchChartPositions } from "@/lib/api";
import { saveChart, setActiveChartId } from "@/lib/storage";
import type { BirthData } from "@/lib/types";

const EXAMPLE_BIRTH: BirthData = {
  name: "Example Reading",
  date: "1990-06-15",
  time: "14:30",
  latitude: 51.5074,
  longitude: -0.1278,
  place_name: "London, United Kingdom",
};

// Fixed lat/long so a random chart never depends on the geocode endpoint
// being up -- this button exists purely for local testing.
const RANDOM_CITIES: { name: string; latitude: number; longitude: number }[] = [
  { name: "London, United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York, United States", latitude: 40.7128, longitude: -74.006 },
  { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Cairo, Egypt", latitude: 30.0444, longitude: 31.2357 },
  { name: "Athens, Greece", latitude: 37.9838, longitude: 23.7275 },
  { name: "Rio de Janeiro, Brazil", latitude: -22.9068, longitude: -43.1729 },
  { name: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093 },
  { name: "Reykjavik, Iceland", latitude: 64.1466, longitude: -21.9426 },
  { name: "Mumbai, India", latitude: 19.076, longitude: 72.8777 },
  { name: "Cape Town, South Africa", latitude: -33.9249, longitude: 18.4241 },
];

function randomBirthData(): BirthData {
  const city = RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)];
  const year = 1930 + Math.floor(Math.random() * (new Date().getFullYear() - 1930));
  const month = 1 + Math.floor(Math.random() * 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = 1 + Math.floor(Math.random() * daysInMonth);
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  return {
    name: "Random Test Chart",
    date: `${year}-${pad2(month)}-${pad2(day)}`,
    time: `${pad2(hour)}:${pad2(minute)}`,
    latitude: city.latitude,
    longitude: city.longitude,
    place_name: city.name,
  };
}

function ChartFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const handleSubmit = async (birth: BirthData) => {
    setLoading(true);
    setError(null);
    try {
      const chart = await fetchChartPositions(birth);
      const id = crypto.randomUUID();
      saveChart({
        id,
        birthData: birth,
        chart,
        messages: [],
        createdAt: new Date().toISOString(),
      });
      setActiveChartId(id);
      router.push(`/reading/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("example") === "1") {
      handleSubmit(EXAMPLE_BIRTH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-parchment">
      <Nav onSignInClick={() => setPaywallOpen(true)} />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-center font-cinzel text-4xl font-semibold text-ink">Cast your chart</h1>
        <p className="mt-3 text-center font-cormorant text-lg italic text-ink-2">
          Enter your birth details for a chart cast in the classical, whole-sign tradition.
        </p>
        <div className="mt-12 flex justify-center">
          <BirthDataForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            initialDate={searchParams.get("date") ?? undefined}
            initialTime={searchParams.get("time") ?? undefined}
            initialPlace={searchParams.get("place") ?? undefined}
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => handleSubmit(randomBirthData())}
            disabled={loading}
            className="border border-line px-4 py-2 font-cinzel text-xs uppercase tracking-[0.1em] text-ink-2 transition-colors hover:border-bronze-dark hover:text-ink disabled:cursor-not-allowed disabled:opacity-[var(--btn-disabled-opacity)]"
          >
            🎲 Random chart (testing)
          </button>
        </div>
      </main>

      <Footer />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense>
      <ChartFormPage />
    </Suspense>
  );
}
