# ADR 0003 — Educational whitelist: limiting what gets indexed when upstream has 100M+ substances

## Context

`/hop-chat/[ten]` looks compounds up directly against PubChem's PUG-REST — a
public database of over 100 million compounds with no concept of "suitable
for a high-school student" or "safe to promote". The route accepts any name
and returns exactly whatever PubChem has.

The concrete consequence observed in practice: `/hop-chat/love` returned MDA
(a synthetic drug), `/hop-chat/sunshine` returned LSD — both real English
slang names that exist on PubChem. A chemistry education product for
secondary-school students was unintentionally generating permalinks, letting
search engines index, and building OG-image previews promoting these
substances, simply because the route couldn't distinguish "a substance in
the curriculum" from "any substance PubChem happens to know about".

## Decision

1. **Never gate access to knowledge** — every substance PubChem has is still
   viewable at `/compound/{name}`, with real data, and there is no "blocklist"
   preventing access.
2. **Only limit what gets prerendered and allowed to be indexed.** A
   substance outside the educational whitelist still renders a normal 200,
   but with a "Outside the standard curriculum" banner and a
   `robots: { index: false }` tag — Google won't index it, but a user who
   types the exact name can still look it up.
3. **The whitelist is derived directly from two categories that already
   exist in the repo, with no new entries invented on top:**

   ```ts
   // src/lib/substance-identification.ts
   for (const { ten } of FEATURED_COMPOUNDS) bySlug.set(canonicalSlug(ten), ...);
   for (const [vi, en] of Object.entries(COMPOUND_ALIASES)) { ... }
   export const EDUCATIONAL_SUBSTANCES: readonly EducationalSubstance[] = [...bySlug.values()];
   ```

   `FEATURED_COMPOUNDS` (compounds featured with a 3D model) and
   `COMPOUND_ALIASES` (39 Vietnamese keys the author curated for the search
   feature) — these two categories *are* the product's real educational
   catalog, curated beforehand for unrelated reasons (being featured, having
   a Vietnamese translation), not a hand-written list invented specifically
   for content filtering.

## Why not write a separate "safe substances" list

A dedicated moderation list would be a second fabricated data point that
would need to be maintained in parallel with
`COMPOUND_ALIASES`/`FEATURED_COMPOUNDS` — two sources that would drift apart
over time (adding a new alias but forgetting to add it to the whitelist, or
vice versa). Deriving it directly from categories that already exist for
other product reasons means the whitelist always stays consistent with
"the substances this site actually showcases", with no manual two-place sync
required.

## Consequences

- The whitelist shares `canonicalSlug()` (ADR 0002), so it automatically
  treats `nước`/`nuoc`/`NƯỚC` as the same entry.
- `generateStaticParams()` only prerenders the whitelist — the build doesn't
  explode into hundreds of millions of static pages.
- If the curriculum coverage expands in the future (new aliases/featured
  substances added), the whitelist grows automatically along with it — there
  is no separate "remember to update the filter list" step.
