/**
 * P-T (Pressure–Temperature) phase diagram via the Clausius-Clapeyron equation.
 *
 * PubChem's periodictable/JSON has NO enthalpy-of-vaporization column
 * (ΔH_vap) — confirmed via fetchAllElements (only 17 columns:
 * AtomicNumber...YearDiscovered, see `mem:06-pubchem-api`). Needs a small
 * pinned table, same pattern as thermodynamics.ts.
 *
 * Source: CRC Handbook of Chemistry and Physics / Lange's Handbook of
 * Chemistry, cross-checked against Wikipedia's "Heats of vaporization of the
 * elements" (data page), accessed 2026-08-02. ΔH_vap at the normal boiling
 * point (1 atm, kJ/mol). Diatomic gaseous elements (H, N, O, F, Cl, Br, I)
 * are computed per X₂ molecule — matching units with PubChem's boiling
 * point, which is also measured for X₂ rather than a lone atom. Any element
 * missing from the table → deltaHVapKJMol returns null, values are NEVER guessed.
 *
 * ONLY computes the LIQUID-GAS boundary (the boiling curve). Does NOT
 * define a triple point/critical point — there is no reliable data source
 * for those quantities across a broad element set, and this phase's
 * acceptance criteria don't verify them either. The melting point is kept
 * CONSTANT with pressure in this simulation (an approximation — would need
 * melting-volume-change data the project doesn't have; the real solid-liquid
 * boundary is nearly vertical for most substances over the pressure range
 * simulated here).
 */

/** R — ideal gas constant, J/(mol·K) */
const GAS_CONSTANT = 8.314;

const VAPORIZATION_ENTHALPY_TABLE_KJ_MOL: Readonly<Record<number, number>> = {
  1: 0.904, // H (H2)
  2: 0.0829, // He
  7: 5.57, // N (N2)
  8: 6.82, // O (O2)
  9: 6.62, // F (F2)
  10: 1.71, // Ne
  11: 97.42, // Na
  12: 128, // Mg
  13: 294, // Al
  17: 20.41, // Cl (Cl2)
  18: 6.43, // Ar
  19: 76.9, // K
  20: 154.7, // Ca
  26: 340, // Fe
  29: 300.4, // Cu
  30: 123.6, // Zn
  35: 29.96, // Br (Br2)
  47: 258, // Ag
  53: 41.57, // I (I2)
  79: 324, // Au
  80: 59.11, // Hg
  82: 179.5, // Pb
};

/**
 * ΔH_vap (kJ/mol) at the normal boiling point (1 atm), by atomic number, or
 * null if that element isn't in the source table — the caller must treat
 * null as "not enough data to derive the boiling curve at pressures other
 * than 1 atm".
 */
export function deltaHVaporizationKJMol(atomicNumber: number): number | null {
  return VAPORIZATION_ENTHALPY_TABLE_KJ_MOL[atomicNumber] ?? null;
}

export interface PhasePoint {
  pressureAtm: number;
  temperatureK: number;
}

/**
 * Clausius-Clapeyron, assuming ΔH_vap is constant with T/P (a reasonable
 * approximation far from the critical point, inaccurate near it):
 *   ln(P/P1) = -(ΔH_vap/R)(1/T - 1/T1)
 * Solves for T given P₁ = the reference pressure at which the boiling point
 * is known (defaults to 1 atm).
 */
export function boilingPointFromPressure(
  deltaHVapKJMolValue: number,
  boilingPointAt1AtmK: number,
  newPressureAtm: number,
  referencePressureAtm: number = 1,
): number {
  const deltaHVapJ = deltaHVapKJMolValue * 1000;
  const inverseT =
    1 / boilingPointAt1AtmK - (GAS_CONSTANT / deltaHVapJ) * Math.log(newPressureAtm / referencePressureAtm);
  return 1 / inverseT;
}

/**
 * Generates a range of liquid-gas boundary points (pressure sampled evenly
 * on a log scale) to plot the curve on the P-T diagram.
 */
export function liquidGasBoundaryCurve(
  deltaHVapKJMolValue: number,
  boilingPointAt1AtmK: number,
  minPressureAtm: number = 0.01,
  maxPressureAtm: number = 100,
  pointCount: number = 60,
): PhasePoint[] {
  const logMin = Math.log10(minPressureAtm);
  const logMax = Math.log10(maxPressureAtm);
  return Array.from({ length: pointCount + 1 }, (_, i) => {
    const logP = logMin + ((logMax - logMin) * i) / pointCount;
    const pressureAtm = 10 ** logP;
    return {
      pressureAtm,
      temperatureK: boilingPointFromPressure(deltaHVapKJMolValue, boilingPointAt1AtmK, pressureAtm),
    };
  });
}
