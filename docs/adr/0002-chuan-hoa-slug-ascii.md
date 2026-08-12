# ADR 0002 — Normalizing compound slugs to ASCII: eliminate the cause, don't patch the leak

## Context

14 of the 39 Vietnamese alias keys in `ALIAS_HOP_CHAT` returned HTTP 500 when
accessed directly: `/hop-chat/nước`, `/hop-chat/đường`, `/hop-chat/muối`,
`/hop-chat/cồn`... Meanwhile `/hop-chat/nuoc` (without diacritics) returned a
normal 200.

A binary search over the characters of the failing strings showed an
**exact** boundary at U+00FF: every character ≤ U+00FF (the Latin-1 range)
passed through fine, every character > U+00FF (Vietnamese diacritic vowels:
`ư`, `ơ`, `ộ`...) crashed. Comparing the same encoded string called against
the API route (`/api/hop-chat/[ten]`) and the OG-image route
(`/hop-chat/-/opengraph-image`) — both returned 200 with the identical
character — only the Page component at the dynamic segment
`/hop-chat/[ten]/page.tsx` returned 500.

This evidence ruled out the initial hypothesis ("PubChem doesn't accept
Unicode characters") — the problem was in Next.js's routing layer handling a
dynamic segment beyond Latin-1, not in the PubChem call itself.

## Decision

Rather than patching each affected route individually (the API route was
already fine, only the Page broke), build a **substance identity layer**
(`src/lib/substance-identification.ts`) as the single source of truth for
turning "whatever the user typed" into a "canonical identity":

1. **The canonical URL is ALWAYS ASCII.** `canonicalSlug()` strips
   Vietnamese diacritics (NFD + strip combining marks), while preserving
   hyphens and commas (which carry meaning in IUPAC nomenclature, e.g.
   `1,3,7-trimethylxanthine`).
2. Any variant with diacritics or extra whitespace → a 308
   `permanentRedirect` to the canonical form, so the Page component never
   renders with a character beyond Latin-1.
3. `lookupVariants()` tries, in order: the literal string with hyphens kept
   first, then the Vietnamese alias, and **only last** does it try turning
   hyphens into spaces — because PubChem genuinely distinguishes
   `1,3,7-trimethylxanthine` (200) from `1,3,7 trimethylxanthine` (404);
   blindly substituting would introduce a new bug while fixing the old one.

## Why not just find where to encode it

Patching each spot where a Unicode character gets blocked (adding a
`decodeURIComponent` here, coercing a route param there...) only masks the
symptom at the exact spots already discovered — the next new route that uses
the same kind of dynamic segment will break the exact same way all over
again. Eliminating the cause — never letting a character > U+00FF reach the
Page component in the first place — removes the entire class of bug at once,
without depending on remembering to reapply the patch to every future route.

## Consequences

- The educational whitelist (ADR 0003) is built on top of this same
  `canonicalSlug()` — one function, two benefits.
- Every new alias added to `ALIAS_HOP_CHAT` is automatically safe — no need
  to manually check which characters it contains.
- Cost: one 308 redirect round-trip for every non-ASCII URL — an acceptable
  trade for eliminating an entire class of production 500s.
