import { sql } from "drizzle-orm";
import { COORD_SCALE_3D } from "../coordinate-scale-3d";
import { callPug, compoundPath } from "./core";
import type { Compound } from "./compounds";

export interface Atom3D {
  atomicNumber: number; // atomic number
  x: number;
  y: number;
  z: number;
}

export interface Bond3D {
  a: number; // atom index 1
  b: number; // atom index 2
  order: number; // bond order 1/2/3
}

export interface Compound3D {
  cid: number;
  queryName: string;
  formula: string | null;
  molarMass: number | null;
  atoms: Atom3D[];
  bonds: Bond3D[];
}

interface Compound3DRecord {
  PC_Compounds: {
    id: { id: { cid: number } };
    atoms: { aid: number[]; element: number[] };
    bonds?: { aid1: number[]; aid2: number[]; order: number[] };
    coords?: { conformers?: { x: number[]; y: number[]; z: number[] }[] }[];
  }[];
}

interface ConformerCache {
  cid: number;
  formula: string | null;
  molarMass: number | null;
  atoms: Atom3D[];
  bonds: Bond3D[];
}

/**
 * Reads a 3D conformer already synced into Postgres (matches alias EXACTLY,
 * accent/case-insensitive — the compound_aliases table has existed since
 * PHASE 4) before hitting the NCBI network — see docs/search.md. A DB error
 * (lost connection, wrong DATABASE_URL, db:push never run…) must NOT break the
 * lookup — it just falls back to calling PubChem as before this cache existed,
 * the same rule already applied to /api/suggestions.
 */
async function fetchConformerFromCache(trimmedName: string): Promise<ConformerCache | null> {
  try {
    // Dynamic import: @/db throws immediately on load if DATABASE_URL is missing —
    // pubchem.ts must still work WITHOUT a DB (e.g. tests/unit/pubchem-parse.test.ts
    // only exercises pure parsing), so the Postgres client is imported ONLY when
    // actually needed, inside this try/catch.
    const { db } = await import("@/db");
    const { rows } = await db.execute<{
      cid: number;
      formula: string | null;
      molarMass: number | null;
      conformers3d: unknown;
    }>(sql`
      SELECT c.cid, c.cong_thuc AS "formula", c.khoi_luong_mol AS "molarMass",
             c.conformers_3d AS "conformers3d"
      FROM compound_aliases a
      JOIN compound_cache c ON c.cid = a.cid
      WHERE f_unaccent(lower(a.alias)) = f_unaccent(lower(${trimmedName}))
        AND c.conformers_3d IS NOT NULL
      LIMIT 1
    `);
    const r = rows[0];
    // PERSISTENCE-BOUNDARY NOTE: `conformers_3d` is a jsonb blob written by
    // compound-sync.ts using the RAW key names `nguyenTu`/`lienKet` (see the
    // comment there). Rows already synced by earlier runs have that exact JSON
    // shape on disk in Postgres — reading them with renamed keys would silently
    // treat every already-cached row as "no conformer", forcing a PubChem
    // network re-fetch instead of a hard failure (safe, but wasteful). Rather
    // than write a DB migration to rewrite historic JSON blobs, we deliberately
    // keep reading the OLD raw keys here and only translate to the new English
    // TypeScript-side names (`atoms`/`bonds`) once the value has left the JSON
    // boundary.
    //
    // The individual atom/bond objects INSIDE those arrays carry the same
    // pre-rename legacy field names too (`so` for atomic number, `bac` for
    // bond order) on any row synced before the pubchem.ts field rename — only
    // rows synced from now on carry `atomicNumber`/`order` directly. Normalize
    // both shapes here so every consumer downstream can rely on Atom3D/Bond3D
    // unconditionally instead of silently rendering with a fallback color.
    const record3d = r?.conformers3d as
      | {
          nguyenTu?: Array<{ x: number; y: number; z: number; so?: number; atomicNumber?: number }>;
          lienKet?: Array<{ a: number; b: number; bac?: number; order?: number }>;
        }
      | undefined;
    if (!r || !record3d?.nguyenTu) return null;
    return {
      cid: r.cid,
      formula: r.formula,
      molarMass: r.molarMass,
      atoms: record3d.nguyenTu.map((atom) => ({
        x: atom.x,
        y: atom.y,
        z: atom.z,
        atomicNumber: atom.atomicNumber ?? atom.so ?? 0,
      })),
      bonds: (record3d.lienKet ?? []).map((bond) => ({
        a: bond.a,
        b: bond.b,
        order: bond.order ?? bond.bac ?? 1,
      })),
    };
  } catch (e) {
    console.error("[pubchem] Failed to read conformer cache, falling back to PubChem:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function fetchCompound3D(name: string, existingProperties?: Compound | null): Promise<Compound3D | null> {
  const trimmedName = name.trim().slice(0, 120);

  const cached = await fetchConformerFromCache(trimmedName);
  if (cached) {
    return {
      cid: cached.cid,
      queryName: name,
      formula: existingProperties?.formula ?? cached.formula,
      molarMass: existingProperties?.molarMass ?? cached.molarMass,
      atoms: cached.atoms,
      bonds: cached.bonds,
    };
  }

  // No longer calls fetchCompound here — the caller usually ALREADY has the
  // properties (passed via existingProperties). Nesting the call used to cost
  // 1 compound-page view 3 PubChem calls for the same substance, instead of 2.
  const response = await callPug<Compound3DRecord>(`/pug/compound/${compoundPath(trimmedName)}/JSON?record_type=3d`);
  const pc = response?.PC_Compounds?.[0];
  const conformer = pc?.coords?.[0]?.conformers?.[0];
  if (!pc || !conformer) return null;

  const { x = [], y = [], z = [] } = conformer;
  // Recenter the molecule on its geometric centroid
  const n = pc.atoms.element.length;
  const tx = x.reduce((a, b) => a + b, 0) / n;
  const ty = y.reduce((a, b) => a + b, 0) / n;
  const tz = z.reduce((a, b) => a + b, 0) / n;

  const atomsLocal: Atom3D[] = pc.atoms.element.map((atomicNumber, i) => ({
    atomicNumber,
    x: (x[i] - tx) * COORD_SCALE_3D,
    y: (y[i] - ty) * COORD_SCALE_3D,
    z: (z[i] - tz) * COORD_SCALE_3D,
  }));

  const bondsLocal: Bond3D[] = (pc.bonds?.aid1 ?? []).map((a1, i) => ({
    a: a1 - 1,
    b: (pc.bonds?.aid2 ?? [])[i] - 1,
    order: (pc.bonds?.order ?? [])[i] || 1,
  }));

  return {
    cid: pc.id.id.cid,
    queryName: name,
    formula: existingProperties?.formula ?? null,
    molarMass: existingProperties?.molarMass ?? null,
    atoms: atomsLocal,
    bonds: bondsLocal,
  };
}
