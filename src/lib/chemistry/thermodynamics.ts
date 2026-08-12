/**
 * Reaction thermodynamics: ΔH°rxn (+ ΔG°rxn when enough data exists) via
 * Hess's law, applied to ALREADY-BALANCED coefficients from equilibrium.ts
 * (called separately, not folded into balanceEquation() — balanceEquation()
 * must stay synchronous for its 50 existing tests and everywhere it's
 * currently used; a thermodynamics lookup needs a network call, so it must
 * be async).
 *
 * THREE SOURCES, EACH WITH ITS OWN ROLE — NEVER mix data of a different
 * nature into the same sum:
 *
 *  1. PINNED TABLE (NIST Chemistry WebBook + CODATA Key Values for
 *     Thermodynamics, Cox/Wagman/Medvedev 1989) — elements in their standard
 *     state (ΔH°f = ΔG°f = 0 by IUPAC definition, not a measurement) and a
 *     handful of compounds consistently cited across sources, manually
 *     verified. The MOST RELIABLE source — always preferred when available.
 *
 *  2. PubChem (`fetchCompound`, already used elsewhere in the project) —
 *     does NOT provide thermodynamic data (PUG-REST/PUG-View has no
 *     reliable heading for it, confirmed in Phase 2). Its role here is
 *     ONLY to: (a) confirm the formula is a substance that actually exists
 *     before querying Materials Project (blocks nonsense formulas), (b) get
 *     the CID to use as a source link shown to the user for their own
 *     verification on PubChem — NOT a source of thermodynamic data.
 *
 *  3. Materials Project API (materialsproject.org, requires
 *     MATERIALS_PROJECT_API_KEY) — formation_energy_per_atom computed via
 *     DFT at ~0K, a DIFFERENT KIND OF QUANTITY from an experimental ΔH°f at
 *     298.15K. Manually cross-checked: matches very closely for Fe2O3
 *     (~-823 vs. -824.2 kJ/mol) but deviates ~6% for Ca(OH)2 — inconsistent,
 *     CANNOT be treated as equivalent to an experimental ΔH°f. Only used
 *     when the pinned table has no entry, always clearly flagged as a
 *     "DFT" source in the result, NEVER shown as if it were an
 *     experimental ΔH°f value, and NEVER used in computing ΔG°rxn (see below).
 *
 * TRIED AND ABANDONED Wikidata (property P3078 ΔH°f / P3071 standard
 * entropy): found 2 REAL DATA ERRORS when manually cross-checking against
 * the most basic substances — CO2 (Q1997) has P3078 = +394 kJ/mol (should
 * be -393.5, WRONG SIGN) and graphite (Q5309) has P3071 = 55.74 J/(mol·K)
 * (should be ~5.7, off by an order of magnitude). There's no way to filter
 * similar errors for substances NOT in the pinned table available for
 * cross-checking — if even CO2/graphite are wrong, less common substances
 * carry higher risk, not lower. Decision: do NOT use Wikidata as a
 * thermodynamic data source in this project.
 *
 * ΔG°rxn can ONLY be computed when EVERY substance in the reaction is in
 * the pinned table — that's the only source with a real, verified ΔG°f.
 * ΔG is NEVER derived from absolute entropy (avoids the risk of mixing
 * mismatched phases/units/inconsistent sources), and Materials Project's
 * DFT value is NEVER used for ΔG°rxn.
 */
import { fetchCompound } from "@/lib/pubchem";
import { parseFormula } from "./formula-parser";

export interface PinnedData {
  /** ΔH°f — standard enthalpy of formation, kJ/mol, 298.15 K */
  deltaH: number;
  /** ΔG°f — standard Gibbs energy of formation, kJ/mol, 298.15 K */
  deltaG: number;
}

/** Source: NIST Chemistry WebBook + CODATA Key Values for Thermodynamics (see file header comment). */
const PINNED_DATA_TABLE: Record<string, PinnedData> = {
  // Elements in their standard state — IUPAC definition, not a measurement.
  H2: { deltaH: 0, deltaG: 0 },
  O2: { deltaH: 0, deltaG: 0 },
  N2: { deltaH: 0, deltaG: 0 },
  Fe: { deltaH: 0, deltaG: 0 },
  C: { deltaH: 0, deltaG: 0 }, // graphite — the standard form of carbon
  // Compounds — real measurements, manually verified (see file header comment).
  H2O: { deltaH: -285.8, deltaG: -237.1 }, // liquid
  CO2: { deltaH: -393.5, deltaG: -394.4 }, // gas
  NH3: { deltaH: -46.1, deltaG: -16.5 }, // gas
  Fe2O3: { deltaH: -824.2, deltaG: -742.2 }, // solid (hematite)
};

/** Element-composition signature — table lookup key, independent of element order in the formula. */
function elementPeriod(table: Record<string, number>): string {
  return Object.entries(table)
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([element, n]) => `${element}${n}`)
    .join("");
}

const PINNED_BY_PERIOD: Map<string, PinnedData> = new Map(
  Object.entries(PINNED_DATA_TABLE).map(([formula, d]) => [elementPeriod(parseFormula(formula)), d]),
);

const EV_TO_KJ_MOL = 96.485;

/**
 * DFT formation energy (eV/atom) from Materials Project → kJ/mol PER
 * FORMULA UNIT (not per atom) — multiplied by the real atom count in one
 * formula unit. Returns null if no stable substance matching the formula is
 * found, the API key is missing, or a network error occurs (must NEVER
 * break the balancing flow).
 */
async function getFromMaterialsProject(formulaPeriod: string, atomCount: number): Promise<number | null> {
  const key = process.env.MATERIALS_PROJECT_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.materialsproject.org/materials/summary/?formula=${encodeURIComponent(formulaPeriod)}&is_stable=true&_fields=formation_energy_per_atom`;
    const res = await fetch(url, { headers: { "X-API-KEY": key } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { formation_energy_per_atom?: number }[] };
    const evPerAtom = json.data?.[0]?.formation_energy_per_atom;
    return evPerAtom == null ? null : evPerAtom * atomCount * EV_TO_KJ_MOL;
  } catch (e) {
    console.error("[thermodynamics] Materials Project error:", e instanceof Error ? e.message : e);
    return null;
  }
}

export interface SubstanceResult {
  deltaH: number;
  /** null when the substance only has a DFT source — Materials Project doesn't provide an equivalent experimental ΔG°f. */
  deltaG: number | null;
  source: "ghim" | "materials-project-dft";
  /** PubChem CID to show as a source link — NOT a source of thermodynamic data. */
  cid: number | null;
}

/**
 * Looks up thermodynamic data for ONE substance. Priority order: pinned
 * table (verified) → Materials Project (DFT, only when PubChem confirms
 * this is a real substance) → null (no data from any source, NEVER guessed).
 */
export async function getSubstanceData(
  formula: string,
  elementTable: Record<string, number>,
): Promise<SubstanceResult | null> {
  const period = elementPeriod(elementTable);
  const pinned = PINNED_BY_PERIOD.get(period);
  if (pinned) return { deltaH: pinned.deltaH, deltaG: pinned.deltaG, source: "ghim", cid: null };

  let cid: number | null = null;
  try {
    const compound = await fetchCompound(formula);
    cid = compound?.cid ?? null;
  } catch {
    cid = null;
  }
  if (cid == null) return null; // PubChem doesn't recognize this as a real substance — skip Materials Project

  const atomCount = Object.values(elementTable).reduce((a, b) => a + b, 0);
  const deltaHDft = await getFromMaterialsProject(period, atomCount);
  if (deltaHDft == null) return null;

  return { deltaH: deltaHDft, deltaG: null, source: "materials-project-dft", cid };
}

export type ThermodynamicsResult =
  | {
      hasData: true;
      deltaH: number;
      /** null if any substance isn't from the pinned table (a DFT source never contributes to ΔG°rxn). */
      deltaG: number | null;
      /** true if ΔH°rxn used at least one DFT value (Materials Project) — must be clearly shown in the UI. */
      hasDftSource: boolean;
      sourceDetails: { name: string; source: "ghim" | "materials-project-dft"; cid: number | null }[];
    }
  | { hasData: false; missingSubstances: string[] };

/**
 * Hess's law: ΔH°rxn = Σ(nᵢ·ΔH°f,products) − Σ(mⱼ·ΔH°f,reactants),
 * computable from ANY COMBINATION of sources (pinned + DFT, since ΔH°f is
 * ΔH°f regardless of source). ΔG°rxn is computed the same way but ONLY when
 * EVERY substance comes from the pinned table. Missing data for ANY
 * substance (in EITHER computation) → don't compute, return the list of
 * missing substances.
 */
export async function calculateReactionThermodynamics(
  leftNames: string[],
  leftTables: Record<string, number>[],
  leftCoefficients: number[],
  rightNames: string[],
  rightTables: Record<string, number>[],
  rightCoefficients: number[],
): Promise<ThermodynamicsResult> {
  const [leftResults, rightResults] = await Promise.all([
    Promise.all(leftTables.map((b, i) => getSubstanceData(leftNames[i], b))),
    Promise.all(rightTables.map((b, i) => getSubstanceData(rightNames[i], b))),
  ]);

  const missing: string[] = [];
  leftResults.forEach((k, i) => {
    if (!k) missing.push(leftNames[i]);
  });
  rightResults.forEach((k, i) => {
    if (!k) missing.push(rightNames[i]);
  });
  if (missing.length > 0) return { hasData: false, missingSubstances: [...new Set(missing)] };

  let deltaH = 0;
  let deltaG: number | null = 0;
  let hasDftSource = false;
  const sourceDetails: { name: string; source: "ghim" | "materials-project-dft"; cid: number | null }[] = [];

  rightResults.forEach((k, i) => {
    const d = k!;
    deltaH += rightCoefficients[i] * d.deltaH;
    if (d.deltaG == null) deltaG = null;
    else if (deltaG != null) deltaG += rightCoefficients[i] * d.deltaG;
    if (d.source === "materials-project-dft") hasDftSource = true;
    sourceDetails.push({ name: rightNames[i], source: d.source, cid: d.cid });
  });
  leftResults.forEach((k, i) => {
    const d = k!;
    deltaH -= leftCoefficients[i] * d.deltaH;
    if (d.deltaG == null) deltaG = null;
    else if (deltaG != null) deltaG -= leftCoefficients[i] * d.deltaG;
    if (d.source === "materials-project-dft") hasDftSource = true;
    sourceDetails.push({ name: leftNames[i], source: d.source, cid: d.cid });
  });

  return { hasData: true, deltaH, deltaG, hasDftSource, sourceDetails };
}
