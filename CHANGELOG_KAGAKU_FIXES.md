# CHANGELOG — KAGAKU Production Hardening

Scope: end-to-end fixes from `CLAUDECODE_KAGAKU_end_to_end_fix_plan.md`, executed on
branch `fix/kagaku-production-hardening`.

## P0 — Broken assets & product truth

- **OG/logo assets (404 → 200).** Added `src/app/opengraph-image.tsx` (site-wide) and
  `src/app/hop-chat/[ten]/opengraph-image.tsx` (per-compound) using `next/og`
  `ImageResponse`, instead of a hardcoded `public/images/og-cover.jpg` path that never
  existed in the repo. Fixed the JSON-LD `Organization.logo` in `src/app/layout.tsx`
  from `/icon.png` (404) to `/icon` (the real route Next.js serves for `src/app/icon.tsx`).
  - **Why:** live site returned 404 for both; social previews/crawlers saw broken images.
- **"Live per view" overclaims removed.** Rewrote copy in `src/app/page.tsx`,
  `src/app/bang-tuan-hoan/page.tsx`, `src/components/chan-trang.tsx`,
  `src/components/dieu-huong.tsx`, and metadata descriptions in `src/app/hop-chat/page.tsx`
  that said data is queried live "mỗi lượt xem" / "truy vấn sống" — the app caches
  PubChem responses for up to 7 days (`revalidate: 604800`). New copy says "đồng bộ,
  cache có kiểm soát" and explains why (PubChem's public-server rate-limit guidance).
  `README.md` data policy section reworded the same way.
  - **Why:** the code was truthful (cache-first), the marketing copy wasn't.

## P0 — Provenance / certainty preserved

- Added `NguyenTo.trangThaiCertainty` and `cauHinhElectronCertainty`
  (`"do-dac" | "du-doan" | "chua-xac-dinh"`) in `src/lib/pubchem.ts`, derived from
  PubChem's own `"Expected to be a ..."` phrasing in `StandardState` — a real signal
  already in the source data, not an invented value.
- UI now labels predicted values instead of presenting them as fact:
  `src/app/nguyen-to/[kyhieu]/page.tsx` (state + electron config), the periodic-table
  grid (`src/components/bang-tuan-hoan/bang.tsx`, asterisk + tooltip + legend), and
  `src/components/thi-nghiem/phong-chuyen-pha.tsx`.
  - **Why:** e.g. Oganesson's `"Expected to be a Gas"` was rendered as a plain "Khí (STP)"
    fact; now shows "Dự đoán: Khí (STP)".

## P0/P1 — Real server-rendered defaults

- Home counters (`src/components/dem-tang.tsx`) now initialize state to the real
  final value instead of `0`, so first paint (and no-JS/crawlers) show the true number;
  the count-up animation still plays once scrolled into view.
- `/hop-chat` and every `/hop-chat/[ten]` permalink fetch the default/requested compound
  server-side (`layHopChat` + `layHopChat3D`) and pass it as props into
  `TrinhPham3D` — first HTML now contains the real formula, CID, molar mass, etc.
  (verified: SSR HTML for `/hop-chat` contains caffeine CID 2519, formula C8H10N4O2,
  194.19 g/mol before any client JS runs).
- `/thi-nghiem/pha-che` fetches the default solute (`NaOH`) server-side and passes it
  into `PhongPhaChe`; first paint shows the real computed mass ("Cân 5.00 g HNaO"),
  not a `…` placeholder.
  - **Why:** SSR is the whole point of the App Router; these were doing client
    `useEffect` fetches that produced empty/placeholder first paint.

## P1 — Electron shell parser fixed (not patched around)

- `lopVoTuCauHinh` moved to `src/lib/electron-config.ts` and rewritten: the old
  recursive noble-gas expansion capped at depth 4, but the longest real chain
  (Rn → Xe → Kr → Ar → Ne → He, needed for every element Z 87–118) requires 5
  substitutions — so all 32 elements with a `[Rn]`-based configuration silently
  collapsed to an empty shell array. New version loops (bounded, with an
  early-exit-on-no-progress guard) until no bracket references remain.
  - **Verified:** Oganesson (Z=118, the deepest chain) now resolves to
    `2 · 8 · 18 · 32 · 32 · 18 · 8` (sums to 118) instead of `[]`.

## P1 — Compound permalinks

- New route `src/app/hop-chat/[ten]/page.tsx`: real, indexable, shareable URL per
  compound (`/hop-chat/caffeine`, `/hop-chat/aspirin`, …), own `generateMetadata`
  (title/description/canonical) and OG image, breadcrumb, related-compounds list,
  explicit PubChem source link, `notFound()` for unresolvable names.
  `generateStaticParams` pre-renders the featured list (`src/lib/hop-chat-noi-bat.ts`).
- The hub `/hop-chat` keeps its existing in-place client search (deliberately —
  a prior commit fixed WebGL context-loss by keeping one persistent `<Canvas>` across
  compound switches; forcing a full route navigation on every search would have
  regressed that). Instead, a successful search updates the address bar via
  `history.replaceState` to the real permalink (`src/components/hop-chat/trinh-pham-3d.tsx`),
  so reload/copy-link/share always lands on the correct compound via the real SSR route.
- Added compound permalinks to `src/app/sitemap.ts`.

## P1 — Search foundation (VN / EN / formula / CID)

- `src/lib/alias-hop-chat.ts`: curated Vietnamese alias map (nước, muối, đường, cồn,
  giấm, xút, thuốc tím, baking soda, đá vôi, …) → real PubChem-searchable name. Wired
  into `layHopChat`, `layHopChat3D`, and `layGoiY` in `src/lib/pubchem.ts`.
- CID-aware lookup: a purely-numeric query now hits `/compound/cid/{cid}` instead of
  `/compound/name/{cid}` (which would 404 for a bare number).
- **Verified against live PubChem:** `nước` → CID 962 (H2O, 18.015 g/mol); `2519` →
  caffeine (C8H10N4O2); suggestion prefix `nu` → `["nước", "nước oxy già", "nước javel"]`;
  numeric suggestion queries short-circuit to `[]` instead of a wasted PubChem call.
- `src/db/schema.ts`: Drizzle schema for a Postgres-backed search/cache layer
  (`compound_cache`, `compound_aliases` with a GIN `to_tsvector` expression index,
  `featured_compounds`, `element_aliases`, `search_logs`). DDL generated and inspected
  (`drizzle/0000_init_search_index.sql`) but **not applied or exercised against a live
  database** — no `DATABASE_URL` credentials were available in this environment beyond
  the `.env.example` placeholder. See `docs/tim-kiem.md` for the activation steps and
  the intended DB-first/PubChem-fallback query flow. Deliberately not wired into the
  request path yet, to avoid shipping an unverified DB code path.

## P1 — Lab routes split

- `/thi-nghiem` is now a landing/hub linking to three dedicated routes:
  `/thi-nghiem/pha-che`, `/thi-nghiem/chuan-do`, `/thi-nghiem/chuyen-pha`
  (`src/app/thi-nghiem/{pha-che,chuan-do,chuyen-pha}/page.tsx`), each with its own
  metadata/canonical and route-level code splitting. Shared room metadata lives in
  `src/lib/phong-thi-nghiem.ts`; cross-room navigation via
  `src/components/thi-nghiem/phong-khac.tsx`. Home page cards
  (`src/app/page.tsx`) and the sitemap now link to the real routes instead of
  `/thi-nghiem#anchor`.

## P1 — Lint (all 14 baseline `react-hooks` errors fixed, not suppressed)

- `Math.random()` impurity (`src/components/ba-d/canh-hero.tsx`): replaced with a
  deterministic hash function for dust-particle placement (visually equivalent).
- Ref-read-during-render (`src/components/ba-d/canh-hop-chat.tsx`): `useRef` → `useMemo`
  for the one-time initial camera position.
- Non-simple `useMemo` deps (`src/components/ba-d/mat-phan-tu.tsx`): dropped the
  `JSON.stringify(...)` deps hack in favor of depending on the arrays directly.
- `setState`-in-effect (`src/components/dieu-huong.tsx`,
  `src/components/thi-nghiem/phong-chuan-do.tsx`,
  `src/components/thi-nghiem/phong-chuyen-pha.tsx`): converted to the
  React-documented "adjust state during render" pattern (compare-and-reset on the
  render path) instead of firing a synchronous `setState` inside `useEffect`.
- `setState`-in-effect for initial data fetch (`trinh-pham-3d.tsx`,
  `phong-pha-che.tsx`): eliminated entirely — the mount-time fetch was replaced by
  the SSR-prop pattern above, so there was no longer an effect to fix.
- Ref mutated from outside its owning hook (`phong-chuyen-pha.tsx`): `useDongCoHat`
  now takes `trangThai`/`rung` as arguments and owns the mutation of its own ref
  internally, instead of returning the ref for the caller to mutate.

## P1/P2 — Accessibility

- `prefers-reduced-motion: reduce` now disables all CSS animations/transitions
  site-wide (`src/app/globals.css`).
- Skip link ("Bỏ qua tới nội dung chính") added before the nav in
  `src/app/layout.tsx`, targeting a new `#noi-dung-chinh` wrapper around `{children}`.
- `:focus-visible` now gets a visible outline site-wide (previously relied on
  browser default only).

## P1/P2 — Security / dependency hygiene

- `next.config.ts` now sends `Content-Security-Policy`, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy` on every response.
  CSP allows `'unsafe-inline'` for script/style (Next.js's own hydration payload and
  the app's extensive `style={{...}}` usage require it without a nonce-based
  middleware, which was out of scope for this pass) but restricts everything else
  (`default-src 'self'`, `frame-ancestors 'none'`, `object`/plugin sources absent, etc).
  **Verified in a real browser:** no CSP violations in the console, WebGL/`Canvas`
  scenes and hydration both work normally on `/` and `/hop-chat`.
- `npm audit` still reports pre-existing moderate/high advisories in transitive
  dependencies (not touched this pass — see Known Limitations).

## Known limitations

- The Postgres search/cache layer (`src/db/schema.ts`) is schema-complete and its
  generated DDL was inspected, but has **not run against a live database** — no
  credentials were available. Runtime query code for it was intentionally not written
  yet (see `docs/tim-kiem.md`).
- CSP ships without a nonce, so `script-src`/`style-src` include `'unsafe-inline'`.
  A stricter nonce-based policy would need per-request middleware — left for a
  follow-up so as not to risk breaking Next.js's own inline hydration scripts
  without the ability to test a middleware-based nonce flow end to end here.
- No manual "reduce motion" UI toggle was added — only the OS-level
  `prefers-reduced-motion` media query is honored (WCAG 2.2.2 is satisfied; a
  user-facing toggle would be additional polish).
- `npm audit` advisories in transitive dependencies were not addressed (no
  next/react major-version bump was in scope; doing so blindly risks its own
  regressions without a chance to fully re-test the 3D/WebGL surface).

## Validation run

- `npm install`, `npm run lint`, `npm run typecheck`, `npm run build` all pass clean.
- Manual checks (built + `next start`, `curl`/browser): `/`, `/bang-tuan-hoan`,
  `/nguyen-to/au`, `/nguyen-to/og`, `/hop-chat`, `/hop-chat/caffeine`,
  `/hop-chat/aspirin`, `/thi-nghiem`, `/thi-nghiem/pha-che`, `/thi-nghiem/chuan-do`,
  `/thi-nghiem/chuyen-pha`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/icon`
  all return 200; `/hop-chat/nonexistent-compound-xyz123` returns 404 as expected.
- Browser check (Chrome via automation): hero and `/hop-chat` 3D scenes render, no
  console errors, CSP does not block hydration/WebGL.
