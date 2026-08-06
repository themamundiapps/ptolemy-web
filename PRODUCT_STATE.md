# Ptolemy — Product State

2026-08-02, updated 2026-08-05 (Pro-tier enforcement + Stripe billing). Written for a fresh Claude session with no prior context on this codebase — assumes only that you know what Ptolemy is conceptually (a traditional/Hellenistic astrology app: natal charts, temperament, electional astrology, transits, synastry, an AI astrologer chat). This is a feature-state snapshot, not an onboarding doc for the code itself — read the code for that. Scope note: this document deliberately does not describe how authentication or payments/Stripe are implemented — only that they exist, where relevant to understanding a feature's completeness.

The team is currently **polishing final features**, not building net-new ones — treat gaps noted below as the polish backlog, not as "someone forgot this."

## 1. Architecture, briefly

- **`ptolemy-web`** (this repo) — Next.js 14 App Router, deployed on Vercel (`https://ptolemy-web.vercel.app`). **This is the actively developed product.**
- **`ptolemy`** (separate repo, Flutter) — an older client hitting the same backend. Not under active feature development; useful only as backend/API reference if ever needed. Backend changes there are risk to that frozen app — flag it explicitly whenever a backend change is proposed, even if this doc doesn't otherwise track it.
- **Backend** — FastAPI (`ptolemy/backend`), deployed to Railway (`https://ptolemy-production.up.railway.app`), serves both clients. All endpoints under `/api/v1`.
- **Astronomical engine** — `pyswisseph`, Moshier analytical ephemeris. Whole-sign houses only — no Placidus or other quadrant systems anywhere.
- **AI** — Anthropic only (`claude-haiku-4-5-20251001`), used for four distinct features: natal Analysis, Synastry analysis, "Personal Synthesis" (single placement, 3-4 sentences), and Chat. All four draw from one shared daily quota — 5 calls/day free, 50/day Pro (`app/services/rate_limit.py`).
- **Persistence** — chart data itself still lives client-side by default (`localStorage` in this repo, keyed by chart id — see `lib/storage.ts`), but is also persisted server-side per cast chart (guest or signed-in) for cross-device recall and claiming on sign-in. The backend is Postgres via SQLAlchemy/Alembic (`backend/app/models/orm.py`) — `users`, `charts`, `ai_usage`, and `subscriptions` tables — no longer the JSON-file placeholders from earlier in the project.

## 2. Entry flow

Landing page (`/`, marketing copy + birth-data form) → casting a chart saves it to `localStorage` and routes to `/hub`, the dashboard. Hub shows a "Today's Sky" snippet (live transit/Moon summary), a quick-ask banner into Chat with a remaining-free-questions count, a feature grid linking to every tab below, and a "Your Records" sidebar.

Two things on the Hub are **advertised but not built**: "Annual Profections 2026" (feature grid tile + sidebar entry) and "Saved Elections" (sidebar entry only). Both are now tagged **"SOON"** — same Cinzel/uppercase/bordered treatment as the "PRO" badge, but in the muted `--ink-soft` tone instead of bronze/terracotta, so it doesn't read as a paid tier. Both surfaces are non-interactive (`pointer-events: none`, dimmed opacity, no hover feedback) — fixed 2026-08-02, see §5. Swept the rest of the product for the same "looks live, does nothing" pattern and found nothing else — the only other stub-like surface is the pricing modal's "Coming soon" message, which is a different failure mode (it tells you outright, rather than silently doing nothing on click) and is payment-related, out of this doc's scope.

There's also visible dev/test scaffolding on the chart-casting page (a "Random chart" button, an `?example=1` auto-fill param) that reads as pre-launch cleanup, not a real feature.

## 3. Feature inventory — the eight Reading-page tabs

All eight live under `/reading/[id]`, orchestrated by `app/reading/[id]/page.tsx`.

| Tab | What it does | Depth / notes |
|---|---|---|
| **Chart** | Natal wheel, planet positions, dignities, Lots, aspects. Tap anything for a written interpretation. | Dignities cover **domicile/exaltation/detriment/fall only** — no triplicity, terms/bounds, or faces/decans anywhere in the backend. 5 major aspects (planet-planet + planet-to-angle). Interpretation content pulls from a ~561-entry pre-written library (see §5→§4 below). Fully built. |
| **House Lords** | All 12 whole-sign houses: ruling sign, ruler planet, where the ruler lands, its dignity there. Tap for interpretation. | Fully built. |
| **Temperament** | Full Ptolemaic 5-significator method (*Tetrabiblos* I & III: Ascendant sign, 1st-house occupant, Ascendant ruler, Moon, season) — not a single score. Quality bars, per-factor breakdown, citation. Expanded view adds free "Health Tendencies" + Pro-gated "Traditional Recommendations" for all 10 pure/mixed temperaments. | Fully built, deep. Reads its label through `lib/useCanonicalTemperament.ts` — the single call site for `/temperament`, shared with Analysis's Section I (see below). |
| **Electional** | The most sophisticated and most tested feature. 3-step wizard (theme → date range → results). Checklist engine: 3-tier Essential/Important/Desirable conditions per day, not a single averaged score. Handles cazimi, applying-vs-separating aspects, void-of-course and via-combusta (shared logic with Transits so the two never disagree on definitions). 6 life-area themes: Love & Relationships, Travel, Business & Career, Health & Body, Spiritual & Learning, Home & Family. | 4 of 6 themes are Pro-gated, enforced both server-side (403 for a free caller) and client-side (locked tile, no paywall bypass). 1072-line/94-test backend test file — the single most heavily tested piece of the whole product. |
| **Transits** | Today's sky vs. the natal chart: Moon state (phase, void-of-course, via combusta) plus a full sorted list of active transiting aspects (applying/separating, favorable/caution, orb). | Fully built, added mid-July. |
| **Synastry** | Two-chart comparison: house overlays (each person's planets into the other's houses), a full inter-aspect grid, angle-based inter-aspects, plus an AI-generated compatibility analysis paragraph (same shape/model as the natal Analysis). Can compare against any saved chart on the device or a manual second entry. | Fully built, added mid-July. **Pro-only** (403 server-side for a free caller; locked-card upsell client-side). |
| **Analysis** | AI-generated 4-5 paragraph natal reading in a Ptolemy/Valens/Lilly voice, restructured client-side into 6 numbered sections (Character, Dominant Planets, Essential Dignities, Key Aspects, Hellenistic Lots, Synthesis). | See §5 — Sections I, III, IV, V, VI are all deterministic/data-grounded and tested; Section II (Dominant Planets) is a known, still-open exception. **Pro-only**, same enforcement as Synastry. |
| **Ask (Chat)** | Accumulated consultation log (entries, not chat bubbles — this layout is settled/approved, not up for redesign). Suggestions grouped into the same 6 life-area themes as Electional, each pulling from its own relevant significators/houses. A Plain / Standard / Traditional response-register selector — same doctrine every time, only the explanation register changes, enforced via an appended backend system-prompt block so the default "Standard" path is byte-identical to the prompt before the feature existed. Collapsible long answers — the most recent answer always shows in full, older long ones collapse to their first paragraphs with a "Read in Full" control, short answers never collapse. | Shipped and deployed live (frontend on Vercel, backend on Railway). Verified via tests + production builds only, no browser was available in the environment that built it — worth a real visual pass at some point. |

## 4. Content library backing the interpretations

Chart/House Lords/Analysis interpretation text is not AI-generated per click — it's a large pre-written library, markdown-sourced, regex-parsed, cached:

- Planets in signs (84 entries), planets in houses (84), aspects (49 base + 141 square/trine/opposition-specific), house-lord-in-house (144), temperament expanded (10), transits (49).
- ~3,700 lines of content, ~561 individually addressable entries total.

Electional's day-by-day synthesis paragraphs, by contrast, are **template-based** (hand-written sentence banks with phrasing variants, client-side), not AI — a deliberate, cheaper alternative to a live model call for that specific surface.

## 5. Analysis tab — title/data consistency (updated 2026-08-02)

The Analysis tab restructures one AI-generated reading into 6 sections. The risk this document exists to track: a section's **title** (or a chip near it) getting generated or classified independently of the **data actually shown underneath it**, so the two can quietly contradict each other. This happened for real once (three bugs, all fixed 2026-07-28 in commit `5bdca0e`) and was hardened further today:

- **Section I (Character/Temperament)** — title and chip read the humoral label through `useCanonicalTemperament(birthData)`, the one shared hook also used by the Temperament tab itself (`lib/useCanonicalTemperament.ts`, added 2026-08-02). The two tabs literally cannot disagree now — before today they called the same endpoint independently, which happened to agree but wasn't structurally guaranteed. AI prose is never consulted for this label.
- **Section III (Essential Dignities)** — title built by `dignityTitle()` (`lib/astro.ts`), fed only `dignitySummary().dignified` (domicile/exaltation). A Fall or Detriment planet cannot structurally reach this title. Tested for 0/1/2/3 dignified planets (grammar + the serial-comma `naturalList()` helper), plus the original Sun-Fall/Moon-Domicile/Jupiter-Detriment regression fixture.
- **Section IV (Key Aspects)** — title picked by `leadAspect()`, which prefers whichever aspect the AI's own paragraph actually discusses, falling back to tightest-orb only if the body mentions none.
- **Section V (Hellenistic Lots)** — title and body are 100% deterministic chart data (`chart.lot_of_fortune.sign` etc.); no AI text involved at all, nothing to drift.
- **Section VI (Synthesis)** — static title, no data dependency.
- **Section II (Dominant Planets) — still open, deliberately not fixed.** `dominantPlanets()` (`components/tabs/AnalysisTab.tsx`) picks the first two planet names it finds by raw string search in the AI's own paragraph — not validated against any deterministic "dominance" criterion. It doesn't currently produce a false *contradiction* the way I/III/IV once did (nothing shown below the title disproves it), but which planets get spotlighted is still purely a function of which names the model's prose happened to mention first. **Open question, needs a doctrine decision before it becomes code**: what should "dominant" mean computationally — angularity, sect light, aspect count, essential dignity, some combination? That's Enzo's call, not an implementation detail; don't guess at a definition.

## 6. Test coverage snapshot

- **Backend**: 316 tests across 14 files (up from 246 in early August — Pro-tier enforcement and Stripe billing, including webhook signature verification and all four required subscription-lifecycle scenarios, landed since then). Heavily concentrated in Electional (94 tests) and Synastry (27).
- **Frontend**: 62 tests. Mostly pure-function unit tests (`chatSuggestions`, `chatAnswerCollapse`, `electionalHelpers`, `astro` — including the Analysis-tab title regression/fixture tests above, `Markdown` rendering). One exception as of 2026-08-02: `lib/useCanonicalTemperament.test.tsx` uses `@testing-library/react`'s `renderHook` + a `jsdom` environment (scoped to that one file via a `// @vitest-environment jsdom` pragma, not the whole suite) — the first component/hook-level test in this repo, added because the hook's request-lifecycle behavior (loading → resolved, stale-response handling on a changed birth date) isn't expressible as a pure function. Everything else still deliberately favors pure, testable logic over DOM-level testing.

## 7. Known gaps / rough edges (the rest of the polish backlog)

1. ~~Electional Pro badges aren't enforced client-side.~~ Fixed 2026-08-05 — enforced both server- and client-side, see the Electional row above.
2. ~~Checkout is explicitly "coming soon."~~ Fixed 2026-08-05 — real Stripe Checkout (hosted), webhook-driven subscription state, and a Billing Portal link on the account page. See `backend/app/services/billing.py` / `app/routers/billing.py`. **Stripe account setup, Price creation, webhook registration, and Stripe Tax activation are still pending in the Dashboard** — the code path is real but untested against a live Stripe account (test-mode key not yet issued).
3. ~~No account/settings page exists.~~ Fixed — `/account` now shows sign-in state, real Free/Pro status, and (for Pro) a Manage Billing link. Still no other settings (e.g. notification prefs) — none exist to manage yet.
4. **Dev/testing scaffolding still visible** on the chart-casting page (random-chart button, `?example=1` auto-fill) — likely needs stripping before a real launch.
5. **Dignity system depth ceiling**: domicile/exaltation/detriment/fall only. No triplicity, terms, or faces anywhere in the backend, if that's ever expected as a traditional-astrology completeness bar.
6. **A couple of shared-quota docstrings are stale** (say the AI budget covers "Analysis, Synastry, Personal Synthesis" but Chat draws from the same pool too and isn't mentioned) — harmless, one-line fix.
7. **Test coverage gaps**: no direct router test for the base `/chart/positions` or `/temperament` endpoints (only indirect, via other tests that call them), and no test file at all for geocoding or timezone resolution.
