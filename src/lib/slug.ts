import { canonicalSlug, lookupVariants } from "./substance-identification";

/** Slugifies a compound name for the /compound/[name] route — a shareable permalink, ALWAYS ASCII-safe */
export function slugifyCompound(name: string): string {
  return canonicalSlug(name);
}

/**
 * Resolves a slug to ONE most-worth-trying lookup keyword (the literal variant).
 * Where every variant needs to be tried (Vietnamese aliases, spacing…) —
 * such as the main compound page and the OG image — use `lookupVariants` +
 * `fetchCompoundByVariant` directly instead.
 */
export function stripCompoundSlug(slug: string): string {
  return lookupVariants(slug)[0];
}
