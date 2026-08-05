"use client";

import Link from "next/link";
import BrandGlyph from "@/components/BrandGlyph";
import SidebarIcon from "@/components/SidebarIcon";
import { SIDEBAR_ITEMS, type TabKey } from "@/lib/tabs";

export default function Sidebar({
  active,
  onSelect,
  hrefFor,
  isPro,
}: {
  active: TabKey;
  onSelect?: (key: TabKey) => void;
  hrefFor?: (key: TabKey) => string;
  // Undefined/null while plan status is still resolving -- no badge shown
  // rather than guessing, since a Pro user briefly seeing "PRO" on their own
  // already-unlocked tab would read as a bug.
  isPro?: boolean | null;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-sticky">
        <div className="brand">
          <div className="glyph">
            <BrandGlyph size={18} />
          </div>
          <span className="name">Ptolemy</span>
        </div>
        <nav>
          {SIDEBAR_ITEMS.map((item) => {
            const className = `item${active === item.key ? " active" : ""}`;
            const content = (
              <>
                <span className="icon">
                  <SidebarIcon tab={item.key} />
                </span>
                <span className="label">{item.label}</span>
                {item.proGated && isPro === false && <span className="sidebar-pro">PRO</span>}
              </>
            );
            return hrefFor ? (
              <Link key={item.key} href={hrefFor(item.key)} className={className}>
                {content}
              </Link>
            ) : (
              <button key={item.key} type="button" className={className} onClick={() => onSelect?.(item.key)}>
                {content}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
