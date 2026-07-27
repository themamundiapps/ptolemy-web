"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyChartRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/reading/${params.id}`);
  }, [params.id, router]);

  return null;
}
