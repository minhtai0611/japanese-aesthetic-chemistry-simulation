# RECOVERY STATE

## Repo summary
Next.js 16 (App Router) + Drizzle/Postgres chemistry education site "KAGAKU". Vietnamese
UI over PubChem PUG-REST data (elements + compounds), 3D molecule/Bohr-model viewers via
react-three-fiber. Branch `fix/kagaku-production-hardening` carries a full pass through
`CLAUDECODE_KAGAKU_end_to_end_fix_plan.md` — see `CHANGELOG_KAGAKU_FIXES.md` for the
complete, itemized list of what changed and why.

## Files changed (see `git status` / `git diff` on this branch for the exhaustive list)
Key new files: `src/lib/electron-config.ts`, `src/lib/alias-hop-chat.ts`,
`src/lib/hop-chat-noi-bat.ts`, `src/lib/phong-thi-nghiem.ts`, `src/lib/slug.ts`,
`src/app/opengraph-image.tsx`, `src/app/hop-chat/[ten]/{page,opengraph-image}.tsx`,
`src/app/thi-nghiem/{pha-che,chuan-do,chuyen-pha}/page.tsx`,
`src/components/thi-nghiem/phong-khac.tsx`, `src/db/schema.ts` (rewritten from empty
placeholder), `drizzle/0000_init_search_index.sql`, `docs/tim-kiem.md`.
Key modified files: `src/lib/pubchem.ts` (certainty fields, CID/alias-aware lookup),
`src/app/layout.tsx` / `next.config.ts` (metadata, security headers), most `.tsx` files
under `src/components/` (lint fixes) and `src/app/` (SSR defaults, truthful copy).

## Unresolved issues
- Postgres search/cache schema (`src/db/schema.ts`) is written and DDL-validated
  (`npx drizzle-kit generate`) but never applied to or queried against a live Postgres —
  no `DATABASE_URL` credentials were available in this session beyond the
  `.env.example` placeholder. Runtime query code intentionally not written yet.
  See `docs/tim-kiem.md` for the exact activation steps.
- CSP ships with `'unsafe-inline'` for script/style (no nonce middleware built this pass).
- `npm audit` pre-existing advisories in transitive deps not addressed.

## Validation command status (last run this session)
- `npm install` — pass
- `npm run lint` — pass (0 errors; started at 14 errors)
- `npm run typecheck` — pass
- `npm run build` — pass (141 routes generated)
- Manual `curl`/browser checks — all pass, see `CHANGELOG_KAGAKU_FIXES.md`

## Exact stop/resume point
Work is complete relative to the plan's Definition of Done. If resuming a future pass:
start from `docs/tim-kiem.md`'s "Cách kích hoạt" section to wire the DB search layer once
real Postgres credentials exist, or from `CHANGELOG_KAGAKU_FIXES.md` → "Known limitations"
for the other deferred items.
