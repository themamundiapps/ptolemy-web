import Link from "next/link";
import BrandGlyph from "@/components/BrandGlyph";

export default function Nav({ onSignInClick }: { onSignInClick: () => void }) {
  return (
    <nav className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-10">
      <Link href="/" className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-bronze text-bronze-dark">
          <BrandGlyph size={22} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-cinzel text-xl font-semibold uppercase tracking-[0.06em] text-ink">Ptolemy</span>
          <span className="font-cinzel text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a7a5c]">
            Traditional Astrology
          </span>
        </div>
      </Link>
      <div className="hidden items-center gap-10 font-cinzel text-sm tracking-[0.05em] text-ink md:flex">
        <a href="/#pillars" className="border-b-[1.5px] border-transparent pb-1.5 hover:text-terracotta">
          Features
        </a>
        <a href="/#process" className="border-b-[1.5px] border-transparent pb-1.5 hover:text-terracotta">
          Process
        </a>
        <Link href="/chart" className="border-b-[1.5px] border-transparent pb-1.5 hover:text-terracotta">
          Chart
        </Link>
        <Link href="/hub" className="border-b-[1.5px] border-transparent pb-1.5 hover:text-terracotta">
          Dashboard
        </Link>
      </div>
      <button
        onClick={onSignInClick}
        className="border border-ink px-5 py-2 font-cinzel text-xs tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-parchment"
      >
        Sign in
      </button>
      </div>
    </nav>
  );
}
