"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BirthDataForm from "@/components/BirthDataForm";
import { ApiError, fetchChartPositions } from "@/lib/api";
import { saveChart } from "@/lib/storage";
import type { BirthData } from "@/lib/types";

const EXAMPLE_BIRTH: BirthData = {
  name: "Example Reading",
  date: "1990-06-15",
  time: "14:30",
  latitude: 51.5074,
  longitude: -0.1278,
  place_name: "London, United Kingdom",
};

function ChartFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/chart/${id}`);
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
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-20">
      <h1 className="text-center font-serif text-4xl text-ink">Your Birth Chart</h1>
      <p className="mt-3 text-center text-muted">
        Enter your birth details for a chart cast in the classical, whole-sign tradition.
      </p>
      <div className="mt-12">
        <BirthDataForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          initialDate={searchParams.get("date") ?? undefined}
          initialTime={searchParams.get("time") ?? undefined}
          initialPlace={searchParams.get("place") ?? undefined}
        />
      </div>
    </main>
  );
}

export default function ChartPage() {
  return (
    <Suspense>
      <ChartFormPage />
    </Suspense>
  );
}
