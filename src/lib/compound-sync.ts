/**
 * Syncs compound_cache + compound_aliases from data ALREADY in the repo
 * (FEATURED_COMPOUNDS + COMPOUND_ALIASES) — never invents new aliases. For
 * each unique substance, calls PubChem for real (through the semaphore
 * already in pubchem.ts) to get its properties + check whether it has a 3D
 * conformer, then records:
 *   - isVerified = true ONLY when PubChem actually returned success (never guessed)
 *   - has3D = true/false based on the real record_type=3d call's outcome
 *   - isEducational = true (every substance in this catalog, by definition)
 *
 * Shared by scripts/seed-compounds.ts (run by hand) and /api/cron/sync (runs
 * on a schedule on Vercel) — one source of logic, no duplicated code.
 */
import { db } from "@/db";
import { compoundCache, compoundAliases } from "@/db/schema";
import { sql } from "drizzle-orm";
import { fetchCompound, fetchCompound3D } from "@/lib/pubchem";
import { COMPOUND_ALIASES } from "@/lib/compound-alias";
import { FEATURED_COMPOUNDS } from "@/lib/featured-compounds";

interface AliasEntry {
  alias: string;
  language: "vi" | "en";
}

export interface SyncResult {
  name: string;
  ok: boolean;
  cid?: number;
  has3D?: boolean;
}

function collectAliases(): Map<string, AliasEntry[]> {
  const byName = new Map<string, AliasEntry[]>();
  const add = (name: string, alias: string, language: "vi" | "en") => {
    const ds = byName.get(name) ?? [];
    if (!ds.some((a) => a.alias === alias)) ds.push({ alias, language });
    byName.set(name, ds);
  };

  for (const [vi, en] of Object.entries(COMPOUND_ALIASES)) {
    add(en, vi, "vi");
    add(en, en, "en");
  }
  for (const c of FEATURED_COMPOUNDS) {
    add(c.name, c.label, "vi");
    add(c.name, c.name, "en");
  }
  return byName;
}

async function syncOneCompound(name: string, aliases: AliasEntry[]): Promise<SyncResult> {
  const properties = await fetchCompound(name);
  if (!properties) return { name, ok: false };

  const conformer3D = await fetchCompound3D(name, properties);
  const has3D = conformer3D !== null;

  // conformers3d stores exactly the shape { nguyenTu, lienKet } that
  // fetchConformerFromCache (src/lib/pubchem.ts) reads back — null when there's
  // no 3D, never guessed. The RAW JSON keys (nguyenTu/lienKet) are deliberately
  // left as-is: this is a persistence boundary — rows already synced earlier
  // have JSON with exactly this shape in Postgres, and renaming the keys would
  // make old rows get misread as "no 3D yet". Only the TypeScript side
  // (Compound3D.atoms/bonds) is renamed.
  const conformers3d = conformer3D ? { nguyenTu: conformer3D.atoms, lienKet: conformer3D.bonds } : null;

  await db
    .insert(compoundCache)
    .values({
      cid: properties.cid,
      queryName: name,
      formula: properties.formula,
      molarMass: properties.molarMass,
      iupac: properties.iupac,
      smiles: properties.smiles,
      inchikey: properties.inchikey,
      xLogP: properties.xLogP,
      has3D,
      conformers3d,
      isEducational: true,
      isVerified: true,
      verifiedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: compoundCache.cid,
      set: {
        queryName: name,
        formula: properties.formula,
        molarMass: properties.molarMass,
        iupac: properties.iupac,
        smiles: properties.smiles,
        inchikey: properties.inchikey,
        xLogP: properties.xLogP,
        has3D,
        conformers3d,
        isEducational: true,
        isVerified: true,
        verifiedAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    });

  for (const { alias, language } of aliases) {
    await db
      .insert(compoundAliases)
      .values({ cid: properties.cid, alias, language })
      .onConflictDoNothing();
  }

  return { name, ok: true, cid: properties.cid, has3D };
}

/** Syncs the entire educational catalog. Returns each substance's result for logging/reporting. */
export async function syncEducationalCompound(): Promise<SyncResult[]> {
  const byName = collectAliases();
  const names = [...byName.keys()];
  return Promise.all(names.map((name) => syncOneCompound(name, byName.get(name)!)));
}
