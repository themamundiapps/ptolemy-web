"use client";

import Link from "next/link";
import { SIDEBAR_ITEMS, type TabKey } from "@/lib/tabs";

export default function Sidebar({
  active,
  onSelect,
  hrefFor,
}: {
  active: TabKey;
  onSelect?: (key: TabKey) => void;
  hrefFor?: (key: TabKey) => string;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="glyph">♃</div>
        <span className="name">Ptolemy</span>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map((item) => {
          const className = `item${active === item.key ? " active" : ""}`;
          const content = (
            <>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
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
    </aside>
  );
}
