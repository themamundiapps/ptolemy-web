"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import BrandGlyph from "@/components/BrandGlyph";
import { clearInternalToken } from "@/lib/internalToken";

/** Product-level navigation (Dashboard, Guide, account) -- shown on the Hub
 * and on the reading page. Deliberately carries no per-tab links: on the
 * reading page, the Sidebar already owns every chart-tab destination (Chart,
 * House Lords, Temperament, Electional, Transits, Synastry, Analysis, Chat),
 * and having both duplicate four of those with different scroll behavior
 * (this nav hides on scroll, the sidebar doesn't) was two entry points to
 * the same place acting differently. */
export default function AppNav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const name = session?.user?.name?.split(" ")[0] ?? "Guest";
  const initial = session?.user?.name?.charAt(0).toUpperCase() ?? "G";

  const handleAvatarClick = () => {
    if (status === "authenticated") {
      setMenuOpen((open) => !open);
    } else {
      signIn("google");
    }
  };

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
      <div className="account" ref={menuRef}>
        <button
          type="button"
          className="av"
          disabled={status === "loading"}
          title={status === "authenticated" ? name : "Sign in"}
          onClick={handleAvatarClick}
        >
          {status === "loading" ? "" : initial}
        </button>
        {menuOpen && status === "authenticated" && (
          <div className="account-menu">
            <div className="name">{session.user?.name}</div>
            <span className="email">{session.user?.email}</span>
            <div className="divider" />
            <Link href="/account" onClick={() => setMenuOpen(false)}>
              Account
            </Link>
            <button
              type="button"
              onClick={() => {
                clearInternalToken();
                signOut();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
