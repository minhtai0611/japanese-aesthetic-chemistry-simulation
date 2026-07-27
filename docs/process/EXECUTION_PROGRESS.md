# EXECUTION PROGRESS — KAGAKU Production Hardening

Plan source: `CLAUDECODE_KAGAKU_end_to_end_fix_plan.md`
Branch: `fix/kagaku-production-hardening`

## Current phase
Phase I — finalize (docs/changelog done, this file is the final status snapshot)

## Tasks done
- Phase A — OG/logo assets fixed (`opengraph-image.tsx`, `/icon` logo), all "live per view" /
  "lễ truy vấn" copy rewritten to truthfully describe controlled 7-day caching (page.tsx,
  bang-tuan-hoan/page.tsx, chan-trang.tsx, dieu-huong.tsx, hop-chat/page.tsx, README.md)
- Phase B — provenance/certainty layer (`trangThaiCertainty`, `cauHinhElectronCertainty`)
  added to `NguyenTo`, surfaced in element detail page, periodic table grid, phase-change room
- Phase C — SSR real defaults: home counters no longer flash 0, `/hop-chat` (+ every
  `/hop-chat/[ten]`) SSRs its compound, `/thi-nghiem/pha-che` SSRs NaOH default mass
- Phase D — `lopVoTuCauHinh` rewritten (extracted to `src/lib/electron-config.ts`); verified
  fix on Oganesson (Z=118, deepest noble-gas chain) — was `[]`, now sums correctly to 118
- Phase E — `/hop-chat/[ten]` permalink routes (own metadata/canonical/OG/notFound/related),
  sitemap updated, hub search syncs the address bar via `history.replaceState`
- Phase F — Vietnamese alias map + CID-aware lookup wired into `layHopChat`/`layGoiY`
  (verified live against PubChem); Postgres search schema written and DDL-validated via
  `drizzle-kit generate`, but NOT applied/exercised against a live DB (no credentials)
- Phase G — `/thi-nghiem` split into `/thi-nghiem/{pha-che,chuan-do,chuyen-pha}`, hub is now
  a landing page linking to each
- Phase H — all 14 baseline `react-hooks` lint errors fixed (not suppressed); reduced-motion
  CSS, skip link, `:focus-visible` added; CSP + security headers added via `next.config.ts`
  (verified in-browser: no console errors, WebGL/hydration unaffected)
- Phase I — `README.md`, `CHANGELOG_KAGAKU_FIXES.md`, `docs/tim-kiem.md` written

## Tasks remaining
- None blocking. See `CHANGELOG_KAGAKU_FIXES.md` → "Known limitations" for deliberately
  deferred items (DB search wiring needs real credentials; nonce-based CSP; audit fixes).

## Latest validation status
`npm install`, `npm run lint`, `npm run typecheck`, `npm run build` all pass clean (last run
this session). Manual route/browser checks in `CHANGELOG_KAGAKU_FIXES.md` → "Validation run".

## Next immediate action
None required to reach Definition of Done. If resuming: the only open thread is wiring
`src/db/schema.ts` into an actual query path once a real `DATABASE_URL` is available
(see `docs/tim-kiem.md`).
