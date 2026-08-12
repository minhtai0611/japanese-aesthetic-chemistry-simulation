/**
 * REAL VAN DER WAALS RADII — source: Alvarez, S. "A cartography of the van
 * der Waals territories." Dalton Trans., 2013, 42, 8617–8636 (DOI:
 * 10.1039/c3dt50599e) — a consolidated table, covering up to Z=96 (Cm),
 * cross-checked against Bondi, A. J. Phys. Chem. 1964, 68, 441–451 (the
 * classic table, which stops at Z≈86 and is missing many elements common in
 * organic/inorganic chemistry).
 *
 * This is a published geometric constant (unchanging over time, not
 * "measured" data requiring multi-source cross-checking like
 * src/lib/chemistry/thermodynamics.ts) — but values must NOT be guessed for
 * elements missing from the source table. Unit: Ångström (Å) — the source
 * table's original unit, not converted.
 */
export const VDW_RADIUS_ANGSTROM: Readonly<Record<number, number>> = {
  1: 1.2, // H
  2: 1.43, // He
  3: 2.12, // Li
  4: 1.98, // Be
  5: 1.91, // B
  6: 1.77, // C
  7: 1.66, // N
  8: 1.5, // O
  9: 1.46, // F
  10: 1.58, // Ne
  11: 2.5, // Na
  12: 2.51, // Mg
  13: 2.25, // Al
  14: 2.19, // Si
  15: 1.9, // P
  16: 1.89, // S
  17: 1.82, // Cl
  18: 1.83, // Ar
  19: 2.73, // K
  20: 2.62, // Ca
  26: 2.04, // Fe
  29: 1.96, // Cu
  30: 2.01, // Zn
  35: 1.86, // Br
  47: 2.1, // Ag
  53: 2.06, // I
  78: 2.13, // Pt
  79: 2.14, // Au
  80: 2.23, // Hg
  82: 2.02, // Pb
};

/**
 * Returns the real VDW radius (Å) for an atomic number, or null if that
 * element is NOT in the Alvarez 2013 source table — the caller must treat
 * null as "not enough data to draw a VDW shell for this atom", not guess a value.
 */
export function vanDerWaalsRadius(atomicNumber: number): number | null {
  return VDW_RADIUS_ANGSTROM[atomicNumber] ?? null;
}
