"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandGlyph from "@/components/BrandGlyph";
import { getGoogleUser } from "@/lib/auth";

/** Product-level navigation (Dashboard, Guide, account) -- shown on the Hub
 * and on the reading page. Deliberately carries no per-tab links: on the
 * reading page, the Sidebar already owns every chart-tab destination (Chart,
 * House Lords, Temperament, Electional, Transits, Synastry, Analysis, Chat),
 * and having both duplicate four of those with different scroll behavior
 * (this nav hides on scroll, the sidebar doesn't) was two entry points to
 * the same place acting differently. */
export default function AppNav() {
  const [name, setName] = useState("Guest");

  useEffect(() => {
    const user = getGoogleUser();
    if (user?.name) setName(user.name.split(" ")[0]);
  }, []);

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
        <Link href="/hub">Dashboard</Link>
        <a href="/#process">Guide</a>
      </div>
      <div className="account" title={name}>
        <div className="av">{name.charAt(0).toUpperCase() || "G"}</div>
      </div>
    </nav>
  );
}
