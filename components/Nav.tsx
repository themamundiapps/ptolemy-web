import Link from "next/link";

export default function Nav({ onSignInClick }: { onSignInClick: () => void }) {
  return (
    <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-line px-6 py-6 sm:px-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bronze-dark font-cinzel text-[15px] text-bronze-dark">
          Ϙ
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-cinzel text-xl font-semibold tracking-wide text-ink">Ptolemy</span>
          <span className="font-ebgaramond text-[10px] uppercase tracking-[0.22em] text-ink-2">
            Traditional Astrology
          </span>
        </div>
      </Link>
      <div className="hidden items-center gap-8 font-ebgaramond text-[15px] text-ink md:flex">
        <a href="/#pillars" className="border-b border-transparent pb-1 hover:border-bronze-dark">
          Features
        </a>
        <a href="/#process" className="border-b border-transparent pb-1 hover:border-bronze-dark">
          Process
        </a>
        <Link href="/chart" className="border-b border-transparent pb-1 hover:border-bronze-dark">
          Chart
        </Link>
        <Link href="/hub" className="border-b border-transparent pb-1 hover:border-bronze-dark">
          Dashboard
        </Link>
      </div>
      <button
        onClick={onSignInClick}
        className="border border-ink px-5 py-2 font-ebgaramond text-sm tracking-wide text-ink transition-colors hover:bg-ink hover:text-parchment"
      >
        Sign in
      </button>
    </nav>
  );
}
