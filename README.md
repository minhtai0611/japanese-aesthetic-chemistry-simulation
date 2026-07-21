# KAGAKU (科学)

A Vietnamese-language virtual chemistry lab built with Next.js. It renders the 118-element periodic table, 3D molecule/compound viewers, and interactive virtual-lab experiments (titration, dilution, phase-change), styled with a Japanese aesthetic — kanji labels alongside Vietnamese copy.

**Live:** https://japanese-aesthetic-chemistry-simula.vercel.app

## Data policy

This app does not fabricate chemistry data. Every element/compound value comes live from [PubChem PUG-REST](https://pubchem.ncbi.nlm.nih.gov/rest/pug) (NCBI, public, no API key), cached for 7 days. Simulated calculations (pH, dilution `C₁V₁=C₂V₂`, molarity `n=m/M`, phase transitions) are real formulas computed on top of that real data.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- [`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber) / `drei` / `postprocessing` (three.js) for 3D scenes
- Tailwind CSS 4
- Drizzle ORM + `pg` targeting Postgres (via `DATABASE_URL`)
- TypeScript 5.9 (strict mode)

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the codebase |
| `npm run typecheck` | Type-check without emitting |
| `npm run db:push` | Push the Drizzle schema to Postgres |

## Project structure

- `src/app/` — routes: `/` (home), `/bang-tuan-hoan` (periodic table), `/nguyen-to/[kyhieu]` (element detail), `/thi-nghiem` (virtual lab), `/hop-chat` (3D compound viewer); API routes under `src/app/api/*`.
- `src/components/ba-d/` — three.js scene components (hero, compound scene, molecule mesh).
- `src/components/bang-tuan-hoan/`, `src/components/thi-nghiem/`, `src/components/hop-chat/` — feature UI per route.
- `src/lib/pubchem.ts` — PubChem PUG-REST client (the only source of chemistry data).
- `src/lib/nguyen-to.ts` — element name/translation tables.
- `src/lib/site.ts` — site metadata/nav.
- `src/db/schema.ts` — Drizzle schema.

## Deployment

Hosted on [Vercel](https://vercel.com) (Hobby tier) with a [Neon](https://neon.tech) Postgres database. Pushes to `master` auto-deploy.
