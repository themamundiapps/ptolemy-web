"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGoogleUser } from "@/lib/auth";

export default function AppNav() {
  const [name, setName] = useState("Guest");

  useEffect(() => {
    const user = getGoogleUser();
    if (user?.name) setName(user.name.split(" ")[0]);
  }, []);

  return (
    <nav className="top">
      <Link href="/hub" className="brand">
        <div className="glyph">♃</div>
        <div>
          <span className="name">Ptolemy</span>
          <span className="sub">Traditional Astrology</span>
        </div>
      </Link>
      <div className="links">
        <Link href="/chart">Chart</Link>
        <a href="#">Electional</a>
        <a href="/hub#today-sky">Transits</a>
        <a href="#">Synastry</a>
        <a href="/#process">Guide</a>
      </div>
      <div className="account">
        <div className="av">{name.charAt(0).toUpperCase() || "G"}</div>
        {name}
      </div>
    </nav>
  );
}
