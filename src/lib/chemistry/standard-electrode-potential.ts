/**
 * Standard electrode potential (E°, reduction convention, vs. the standard
 * hydrogen electrode SHE at 25°C/298.15K, ion activity = 1).
 *
 * PubChem does NOT have this column — needs a small pinned table, same
 * pattern as phase-diagram.ts/thermodynamics.ts. Source: Wikipedia "Standard
 * electrode potential (data page)", compiled from the CRC Handbook of
 * Chemistry and Physics / Electrochemical Series (Vanýsek), accessed
 * 2026-08-03. Any element missing → getStandardElectrodePotential returns
 * null, values are NEVER guessed.
 *
 * H (Z=1) is the standard hydrogen electrode (SHE) — a FIXED reference
 * electrode at 0V. This simulation doesn't model H₂ gas pressure, so if
 * the user picks H as an electrode, the UI must lock the concentration
 * slider for that electrode (see electrochemical-cell-lab.tsx) instead of
 * applying the Nernst correction to it.
 */

export interface StandardElectrode {
  /** E° (V), reduction convention, vs. SHE */
  eV: number;
  /** Number of electrons exchanged in the reduction half-reaction */
  n: number;
  /** Reduction half-reaction, for display */
  halfReaction: string;
}

const STANDARD_ELECTRODE_POTENTIAL_TABLE: Readonly<Record<number, StandardElectrode>> = {
  3: { eV: -3.04, n: 1, halfReaction: "Li⁺ + e⁻ → Li" },
  19: { eV: -2.942, n: 1, halfReaction: "K⁺ + e⁻ → K" },
  20: { eV: -2.84, n: 2, halfReaction: "Ca²⁺ + 2e⁻ → Ca" },
  11: { eV: -2.713, n: 1, halfReaction: "Na⁺ + e⁻ → Na" },
  12: { eV: -2.356, n: 2, halfReaction: "Mg²⁺ + 2e⁻ → Mg" },
  13: { eV: -1.676, n: 3, halfReaction: "Al³⁺ + 3e⁻ → Al" },
  30: { eV: -0.7618, n: 2, halfReaction: "Zn²⁺ + 2e⁻ → Zn" },
  26: { eV: -0.44, n: 2, halfReaction: "Fe²⁺ + 2e⁻ → Fe" },
  28: { eV: -0.257, n: 2, halfReaction: "Ni²⁺ + 2e⁻ → Ni" },
  50: { eV: -0.13, n: 2, halfReaction: "Sn²⁺ + 2e⁻ → Sn" },
  82: { eV: -0.126, n: 2, halfReaction: "Pb²⁺ + 2e⁻ → Pb" },
  1: { eV: 0, n: 2, halfReaction: "2H⁺ + 2e⁻ → H₂ (SHE, fixed)" },
  29: { eV: 0.337, n: 2, halfReaction: "Cu²⁺ + 2e⁻ → Cu" },
  47: { eV: 0.7996, n: 1, halfReaction: "Ag⁺ + e⁻ → Ag" },
  80: { eV: 0.85, n: 2, halfReaction: "Hg²⁺ + 2e⁻ → Hg" },
  79: { eV: 1.52, n: 3, halfReaction: "Au³⁺ + 3e⁻ → Au" },
};

/**
 * Standard electrode potential by atomic number, or null if that element
 * isn't in the source table — the caller must treat null as "not enough
 * data to use as an electrode in this electrochemical cell".
 */
export function getStandardElectrodePotential(atomicNumber: number): StandardElectrode | null {
  return STANDARD_ELECTRODE_POTENTIAL_TABLE[atomicNumber] ?? null;
}
