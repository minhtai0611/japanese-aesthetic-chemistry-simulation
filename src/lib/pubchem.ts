/**
 * REAL DATA LAYER — PUBCHEM PUG-REST (NCBI, public, no API key required).
 *
 * TRANSPARENCY STATEMENT: this website does NOT fabricate chemistry data.
 *  - Periodic table of 118 elements : /rest/pug/periodictable/JSON
 *  - Compound properties            : /rest/pug/compound/.../property/...
 *  - 3D spatial coordinates         : /rest/pug/compound/.../JSON?record_type=3d
 *  - Name suggestions               : /rest/autocomplete/compound/{term}/JSON
 * The simulations (pH, dilution, phase change...) are physics/chemistry math
 * computed ON TOP of this API data (Kw, n = m/M, C₁V₁ = C₂V₂, phase-change temperature).
 */

import { LAYOUT_MAP, VIETNAMESE_NAMES, DEFAULT_TRANSLATIONS } from "./element";
import { electronShellConfig } from "./electron-config";
import { translateCompoundName, suggestVietnameseName } from "./compound-alias";
import { sql } from "drizzle-orm";
import { COORD_SCALE_3D } from "./coordinate-scale-3d";
import { requestPubChemSlot } from "./rate-limiter";

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest";
const WEEK = 60 * 60 * 24 * 7; // 7-day cache

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
async function callPug<T>(path: string, revalidate = WEEK): Promise<T | null> {
  const result = await callPugSafely<T>(path, revalidate);
  if (result.status === "co") return result.data;
  if (result.status === "loi") console.error(`[pubchem] ${path}: ${result.message}`);
  return null;
}

/* ---------------------------------- ELEMENTS ---------------------------------- */

export interface ElementInfo {
  atomicNumber: number;
  symbol: string;
  englishName: string;
  vietnameseName: string;
  atomicMass: number | null;        // u
  cpkColor: string;                  // "#RRGGBB"
  electronConfig: string;
  electronegativity: number | null;         // Pauling
  radiusPm: number | null;        // pm
  ionizationEnergy: number | null;  // eV
  electronAffinity: number | null;    // eV
  oxidationStates: string;
  rawState: string;            // raw data from the API
  stateOfMatter: "ran" | "long" | "khi" | "chua-xac-dinh";
  /**
   * Certainty of the standard state: PubChem itself flags synthetic superheavy
   * elements — where too few atoms have ever existed to measure a bulk state —
   * with the phrase "Expected to be a ...". This field preserves that signal
   * instead of letting the UI display it as a confidently measured fact.
   */
  stateCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  /**
   * The electron configuration of elements in the same "state not measured"
   * group above has also never been determined by spectroscopic experiment —
   * only theoretical calculation exists. Derived from the SAME source signal
   * (rawState), not made up.
   */
  electronConfigCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  meltingPointK: number | null;        // K
  boilingPointK: number | null;             // K
  density: number | null;            // g/cm³
  groupFamilyEn: string;
  groupFamilyVi: string;
  yearDiscovered: string;
  group: number;
  period: number | null;
  displayPeriod: number;
  block: "s" | "p" | "d" | "f";
  electronShells: number[];                 // e- count per shell n=1..7 (from the API's electron config)
}

interface PeriodicTableResponse {
  Table: {
    Columns: { Column: string[] };
    Row: { Cell: string[] }[];
  };
}

function numberOrNull(v: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function stateOf(rawState: string): ElementInfo["stateOfMatter"] {
  const g = rawState.toLowerCase();
  if (g.includes("solid")) return "ran";
  if (g.includes("liquid")) return "long";
  if (g.includes("gas")) return "khi";
  return "chua-xac-dinh";
}

/** PubChem flags a guess with the phrase "Expected to be a ..." instead of a direct measurement */
function confidenceFromOriginalState(rawState: string): ElementInfo["stateCertainty"] {
  if (!rawState) return "chua-xac-dinh";
  return /expected/i.test(rawState) ? "du-doan" : "do-dac";
}

/**
 * Normalizes a CPK color code from PubChem.
 *
 * PubChem strips leading zeros: Palladium's standard Jmol color is #006985 but
 * the API returns "6985". padStart(6, "F") would turn it into "#FF6985" (pink) —
 * a color code that doesn't exist in any CPK/Jmol standard. Must pad with "0".
 */
export function cpkColorFrom(raw: string | undefined): { hex: string; source: "pubchem" | "mac-dinh" } {
  const v = (raw ?? "").trim();
  if (!/^[0-9A-Fa-f]{1,6}$/.test(v)) return { hex: "#C8C4BC", source: "mac-dinh" };
  return { hex: `#${v.toUpperCase().padStart(6, "0")}`, source: "pubchem" };
}

let elementCount = 0;

export async function fetchAllElements(): Promise<ElementInfo[]> {
  const data = await callPug<PeriodicTableResponse>("/pug/periodictable/JSON");
  if (!data?.Table?.Row?.length) return [];

  const columns = data.Table.Columns.Column;
  const columnIndex = (name: string) => columns.indexOf(name);

  const elements = data.Table.Row.map((row) => {
    const c = row.Cell;
    const atomicNumber = Number(c[columnIndex("AtomicNumber")]);
    const layout = LAYOUT_MAP.get(atomicNumber) ?? { group: 0, displayPeriod: 0, period: null, block: "s" as const };
    const groupFamily = c[columnIndex("GroupBlock")] ?? "";
    return {
      atomicNumber,
      symbol: c[columnIndex("Symbol")] ?? "",
      englishName: c[columnIndex("Name")] ?? "",
      vietnameseName: VIETNAMESE_NAMES[atomicNumber] ?? c[columnIndex("Name")] ?? "",
      atomicMass: numberOrNull(c[columnIndex("AtomicMass")]),
      cpkColor: cpkColorFrom(c[columnIndex("CPKHexColor")]).hex,
      electronConfig: c[columnIndex("ElectronConfiguration")] ?? "",
      electronegativity: numberOrNull(c[columnIndex("Electronegativity")]),
      radiusPm: numberOrNull(c[columnIndex("AtomicRadius")]),
      ionizationEnergy: numberOrNull(c[columnIndex("IonizationEnergy")]),
      electronAffinity: numberOrNull(c[columnIndex("ElectronAffinity")]),
      oxidationStates: c[columnIndex("OxidationStates")] || "—",
      rawState: c[columnIndex("StandardState")] ?? "",
      stateOfMatter: stateOf(c[columnIndex("StandardState")] ?? ""),
      stateCertainty: confidenceFromOriginalState(c[columnIndex("StandardState")] ?? ""),
      electronConfigCertainty: confidenceFromOriginalState(c[columnIndex("StandardState")] ?? ""),
      meltingPointK: numberOrNull(c[columnIndex("MeltingPoint")]),
      boilingPointK: numberOrNull(c[columnIndex("BoilingPoint")]),
      density: numberOrNull(c[columnIndex("Density")]),
      groupFamilyEn: groupFamily,
      groupFamilyVi: DEFAULT_TRANSLATIONS[groupFamily] ?? groupFamily,
      yearDiscovered: c[columnIndex("YearDiscovered")] || "—",
      group: layout.group,
      period: layout.period,
      displayPeriod: layout.displayPeriod,
      block: layout.block,
      electronShells: [] as number[],
    };
  });

  const theoKyHieu = new Map(elements.map((n) => [n.symbol, { electronConfig: n.electronConfig }]));
  elements.forEach((n) => (n.electronShells = electronShellConfig(n.electronConfig, theoKyHieu)));
  elementCount = elements.length;
  return elements;
}

export function loadedElementCount() {
  return elementCount;
}

export async function getElementBySymbol(symbol: string): Promise<ElementInfo | null> {
  const allElements = await fetchAllElements();
  const k = symbol.toLowerCase();
  return allElements.find((n) => n.symbol.toLowerCase() === k) ?? null;
}

/* ---------------------------------- COMPOUNDS ----------------------------------- */

export interface Compound {
  cid: number;
  queryName: string;
  formula: string | null;
  molarMass: number | null; // g/mol
  exactMass: number | null;
  iupac: string | null;
  smiles: string | null;
  inchikey: string | null;
  xLogP: number | null;
  tpsa: number | null;
  hbd: number | null;
  hba: number | null;
  rotatableBonds: number | null;
  complexity: number | null;
}

interface PropertyTableResponse {
  PropertyTable: {
    Properties: {
      CID: number;
      MolecularFormula?: string;
      MolecularWeight?: string;
      ExactMass?: string;
      IUPACName?: string;
      ConnectivitySMILES?: string;
      SMILES?: string;
      InChIKey?: string;
      XLogP?: number;
      TPSA?: number;
      HBondDonorCount?: number;
      HBondAcceptorCount?: number;
      RotatableBondCount?: number;
      Complexity?: number;
    }[];
  };
}

/**
 * Determines the PUG-REST path segment for a lookup keyword:
 *  - all digits → treat as a real CID (/compound/cid/{cid})
 *  - otherwise  → translate a common Vietnamese alias (if any), then look up by name (/compound/name/{name})
 */
function compoundPath(keyword: string): string {
  const t = keyword.trim();
  if (/^\d+$/.test(t)) return `cid/${t}`;
  return `name/${encodeURIComponent(translateCompoundName(t))}`;
}

/**
 * Tries each lookup variant of a slug in turn (see `lookupVariants` in
 * substance-identification.ts) until PubChem returns data — stops at the first
 * matching variant. Shared by both the compound page and the OG image, so each
 * one doesn't try a different variant and end up with mismatched results.
 */
export async function fetchCompoundByVariant(
  variants: readonly string[],
): Promise<{ matchedKeyword: string; compound: Compound | null }> {
  for (const variant of variants) {
    const compound = await fetchCompound(variant);
    if (compound) return { matchedKeyword: variant, compound };
  }
  return { matchedKeyword: variants[0], compound: null };
}

export async function fetchCompound(name: string): Promise<Compound | null> {
  const data = await callPug<PropertyTableResponse>(
    `/pug/compound/${compoundPath(name)}/property/MolecularFormula,MolecularWeight,ExactMass,IUPACName,ConnectivitySMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`,
  );
  const p = data?.PropertyTable?.Properties?.[0];
  if (!p) return null;
  return {
    cid: p.CID,
    queryName: name,
    formula: p.MolecularFormula ?? null,
    molarMass: numberOrNull(p.MolecularWeight ?? ""),
    exactMass: numberOrNull(p.ExactMass ?? ""),
    iupac: p.IUPACName ?? null,
    smiles: p.ConnectivitySMILES ?? p.SMILES ?? null,
    inchikey: p.InChIKey ?? null,
    xLogP: p.XLogP ?? null,
    tpsa: p.TPSA ?? null,
    hbd: p.HBondDonorCount ?? null,
    hba: p.HBondAcceptorCount ?? null,
    rotatableBonds: p.RotatableBondCount ?? null,
    complexity: p.Complexity ?? null,
  };
}

/* ------------------------------ 3D COMPOUND STRUCTURE ------------------------------- */

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

/* ----------------------------------- SUGGESTIONS ------------------------------------- */

interface SuggestionJson {
  dictionary_terms?: { compound?: string[] };
}

export async function getSuggestions(keyword: string): Promise<string[]> {
  const q = keyword.trim().replace(/[/\\]/g, "").slice(0, 60);
  if (q.length < 2) return [];

  // Common Vietnamese aliases (nước, muối, đường…) — put the real English form at the head of the suggestions.
  const vietnameseSuggestions = suggestVietnameseName(q);

  // Pure-numeric CID: PubChem autocomplete doesn't understand numbers, look it up directly without name suggestions.
  if (/^\d+$/.test(q)) return [];

  const data = await callPug<SuggestionJson>(
    `/autocomplete/compound/${encodeURIComponent(translateCompoundName(q))}/JSON?limit=8`,
  );
  const pubchemSuggestions = data?.dictionary_terms?.compound ?? [];
  return [...new Set([...vietnameseSuggestions, ...pubchemSuggestions])].slice(0, 8);
}
