"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandGlyph from "@/components/BrandGlyph";
import { getGoogleUser } from "@/lib/auth";
import { getActiveChartId } from "@/lib/storage";

export default function AppNav() {
  const [name, setName] = useState("Guest");
  const [chartId, setChartId] = useState<string | null>(null);

  useEffect(() => {
    const user = getGoogleUser();
    if (user?.name) setName(user.name.split(" ")[0]);
    setChartId(getActiveChartId());
  }, []);

  const tabHref = (tab: string) => (chartId ? `/reading/${chartId}?tab=${tab}` : "/chart");

  return (
    <nav className="top">
      <Link href="/hub" className="brand">
        <div className="glyph">
          <BrandGlyph />
        </div>
        <div>
          <span className="name">Ptolemy</span>
          <span className="sub">Traditional Astrology</span>
        </div>
      </Link>
      <div className="links">
        <Link href={tabHref("chart")}>Chart</Link>
        <Link href={tabHref("electional")}>Electional</Link>
        <Link href={tabHref("transits")}>Transits</Link>
        <Link href={tabHref("synastry")}>Synastry</Link>
        <a href="/#process">Guide</a>
      </div>
      <div className="account">
        <div className="av">{name.charAt(0).toUpperCase() || "G"}</div>
        {name}
      </div>
    </nav>
  );
}
