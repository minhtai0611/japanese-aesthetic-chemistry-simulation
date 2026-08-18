/**
 * Shared PUG-REST fetch core — used by every pubchem/* submodule.
 *
 * TRANSPARENCY STATEMENT: this website does NOT fabricate chemistry data.
 *  - Periodic table of 118 elements : /rest/pug/periodictable/JSON
 *  - Compound properties            : /rest/pug/compound/.../property/...
 *  - 3D spatial coordinates         : /rest/pug/compound/.../JSON?record_type=3d
 *  - Name suggestions               : /rest/autocomplete/compound/{term}/JSON
 * The simulations (pH, dilution, phase change...) are physics/chemistry math
 * computed ON TOP of this API data (Kw, n = m/M, C₁V₁ = C₂V₂, phase-change temperature).
 */

import { translateCompoundName } from "../compound-alias";
import { requestPubChemSlot } from "../rate-limiter";

export const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest";
export const WEEK = 60 * 60 * 24 * 7; // 7-day cache

/** Three distinct states, which must NOT be collapsed into one */
export type PugResult<T> =
  | { status: "co"; data: T }
  | { status: "khong-co" } // PubChem confirms it doesn't exist
  | { status: "loi"; message: string }; // couldn't reach PubChem

/**
 * Calls PubChem PUG-REST, clearly distinguishing 3 states: data found,
 * PubChem confirms it doesn't exist (404 or {Fault}), or couldn't be reached
 * (network error, timeout, 5xx/429 on their end). The old `callPug` collapsed
 * all three into `null` — that was the root cause of a build-time rate-limit
 * once being mistaken for "substance doesn't exist" and a 404 getting baked
 * hard into the static build.
 */
export async function callPugSafely<T>(path: string, revalidate = WEEK): Promise<PugResult<T>> {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      await requestPubChemSlot();
      const res = await fetch(`${PUG}${path}`, {
        next: { revalidate },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      // 404 from PubChem = confirmed not to exist
      if (res.status === 404) return { status: "khong-co" };
      // 5xx / 429 = error on their end ⇒ retry
      if (res.status >= 500 || res.status === 429) throw new Error(`upstream ${res.status}`);
      if (!res.ok) return { status: "loi", message: `HTTP ${res.status}` };

      const json = (await res.json()) as { Fault?: unknown } & T;
      // PubChem returns HTTP 200 with a {Fault} body for malformed queries — KEEP this guard
      if (json && typeof json === "object" && "Fault" in json) return { status: "khong-co" };
      return { status: "co", data: json as T };
    } catch (e) {
      if (attempt === 2) {
        return { status: "loi", message: e instanceof Error ? e.message : String(e) };
      }
      await new Promise((s) => setTimeout(s, 300 * 2 ** attempt)); // exponential backoff
    }
  }
  return { status: "loi", message: "out of retries" };
}

/** Keeps the old signature for code not yet migrated to callPugSafely — but LOGS clearly when swallowing an error */
export async function callPug<T>(path: string, revalidate = WEEK): Promise<T | null> {
  const result = await callPugSafely<T>(path, revalidate);
  if (result.status === "co") return result.data;
  if (result.status === "loi") console.error(`[pubchem] ${path}: ${result.message}`);
  return null;
}

export function numberOrNull(v: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Determines the PUG-REST path segment for a lookup keyword:
 *  - all digits → treat as a real CID (/compound/cid/{cid})
 *  - otherwise  → translate a common Vietnamese alias (if any), then look up by name (/compound/name/{name})
 */
export function compoundPath(keyword: string): string {
  const t = keyword.trim();
  if (/^\d+$/.test(t)) return `cid/${t}`;
  return `name/${encodeURIComponent(translateCompoundName(t))}`;
}
