/**
 * COMPOUND IDENTITY LAYER
 *
 * Consolidates the fix for a family of bugs sharing one root cause: no layer
 * was responsible for turning "whatever the user typed" into "a substance's
 * canonical identifier".
 *
 *   - A URL containing Vietnamese characters (> U+00FF) crashed the Page
 *     render at the dynamic segment (14/39 Vietnamese aliases in production —
 *     confirmed by real measurement, NOT a guess: the same encoded string
 *     called against the API route or the OG-image route both returned 200,
 *     only the Page route returned 500).
 *   - An arbitrary slug opens up PubChem's entire database of over a hundred
 *     million substances — a high-school educational product unintentionally
 *     serving up LSD/MDA via their English street names.
 *
 * Principles:
 *   1. The canonical URL is ALWAYS ASCII. A variant with diacritics/extra
 *      whitespace → 308.
 *   2. Only substances on the educational whitelist get indexed (other
 *      substances are still viewable — knowledge isn't blocked — but get a
 *      banner + noindex).
 *
 * NO AI used. Normalizes via NFD + diacritic stripping (standard Unicode),
 * looked up against a deterministic table.
 */
import { COMPOUND_ALIASES } from "./compound-alias";
import { FEATURED_COMPOUNDS } from "./featured-compounds";

/** Strips Vietnamese diacritics, keeping hyphens intact (meaningful in IUPAC nomenclature) */
export function stripVietnameseDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Canonical slug: ALWAYS ASCII-safe, safe for a dynamic route segment */
export function canonicalSlug(name: string): string {
  const s = stripVietnameseDiacritics(name.trim().toLowerCase())
    .replace(/[^a-z0-9,\-\s.]/g, "") // keeps commas/hyphens/periods — meaningful in chemistry nomenclature
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "khong-xac-dinh";
}

const CANONICAL_ALIASES = new Map(Object.entries(COMPOUND_ALIASES).map(([vi, en]) => [canonicalSlug(vi), en]));

/** Looks up an alias by its normalized slug — 'nuoc', 'nước', 'NƯỚC' all match */
export function resolveAlias(keyword: string): string | null {
  return CANONICAL_ALIASES.get(canonicalSlug(keyword)) ?? null;
}

/**
 * Recovers lookup-keyword variants from a canonical slug.
 *
 * IMPORTANT: hyphens must NOT be blindly turned into spaces — PubChem
 * distinguishes '1,3,7-trimethylxanthine' (200) from '1,3,7 trimethylxanthine'
 * (404). Strategy: try the literal form first, then the Vietnamese alias, and
 * only try the space variant once both of those have failed.
 */
export function lookupVariants(slug: string): string[] {
  const raw = decodeURIComponent(slug).trim();
  const variants = new Set<string>();
  variants.add(raw); // 1. literal form (hyphens kept)
  const aliasHit = resolveAlias(raw);
  if (aliasHit) variants.add(aliasHit); // 2. Vietnamese alias → PubChem name
  variants.add(raw.replace(/-/g, " ")); // 3. only try the space variant last
  return [...variants];
}

/** Does this URL slug need a 308 redirect to its canonical form? Returns null if already canonical. */
export function canRedirect(slug: string): string | null {
  const raw = decodeURIComponent(slug);
  const canon = canonicalSlug(raw);
  return canon !== raw ? canon : null;
}

/* --------------------------- EDUCATIONAL WHITELIST --------------------------- */

/**
 * Substances allowed to be prerendered + indexed. Anything outside this list
 * is still viewable (knowledge isn't blocked) but gets noindex + an "outside
 * the standard curriculum" banner.
 *
 * Why: /compound/love returns MDA, /compound/sunshine returns LSD, in an
 * educational product for high-school students — not something we intend to
 * promote.
 *
 * Derived DIRECTLY from two catalogs already in the repo (no entries invented
 * beyond real data): FEATURED_COMPOUNDS (featured substances with 3D) and
 * COMPOUND_ALIASES (39 Vietnamese keys the author curated). This IS the
 * product's real "educational catalog", not a made-up manual list.
 */
interface EducationalSubstance {
  slug: string;
  name: string;
}

const bySlug = new Map<string, EducationalSubstance>();
for (const { name } of FEATURED_COMPOUNDS) bySlug.set(canonicalSlug(name), { slug: canonicalSlug(name), name });
for (const [vi, en] of Object.entries(COMPOUND_ALIASES)) {
  const slug = canonicalSlug(vi);
  if (!bySlug.has(slug)) bySlug.set(slug, { slug, name: en });
}

export const EDUCATIONAL_SUBSTANCES: readonly EducationalSubstance[] = [...bySlug.values()];

const EDUCATIONAL_SLUGS = new Set(EDUCATIONAL_SUBSTANCES.map((c) => c.slug));

/** Is this substance (by name or slug) on the educational whitelist? */
export const isEducationalSubstance = (nameOrSlug: string): boolean => EDUCATIONAL_SLUGS.has(canonicalSlug(nameOrSlug));
