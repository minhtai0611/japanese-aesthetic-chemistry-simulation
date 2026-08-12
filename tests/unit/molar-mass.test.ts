import { describe, it, expect } from "vitest";
import { calculateMolarMass, crossCheckMolarMass, molarMassBySymbolTable } from "@/lib/chemistry/molar-mass";
import { parseFormula } from "@/lib/chemistry/formula-parser";

/**
 * Atomic-mass fixture (IUPAC, real values) — ONLY for checking the
 * calculation in this test. The real app does NOT use this static table —
 * it always fetches directly from fetchAllElements() (PubChem) at runtime,
 * see scripts/cross-check-molar-mass.ts for cross-checking against real
 * PubChem data.
 */
const SAMPLE_MOLAR_MASSES = new Map<string, number>([
  ["H", 1.008],
  ["O", 15.999],
  ["C", 12.011],
  ["Na", 22.99],
  ["Cl", 35.45],
  ["Ca", 40.078],
  ["S", 32.06],
  ["Fe", 55.845],
]);

describe("calculateMolarMass", () => {
  it("H2O ≈ 18.015", () => {
    expect(calculateMolarMass(parseFormula("H2O"), SAMPLE_MOLAR_MASSES)).toBeCloseTo(18.015, 2);
  });
  it("NaCl ≈ 58.44", () => {
    expect(calculateMolarMass(parseFormula("NaCl"), SAMPLE_MOLAR_MASSES)).toBeCloseTo(58.44, 1);
  });
  it("CaCO3 ≈ 100.09", () => {
    expect(calculateMolarMass(parseFormula("CaCO3"), SAMPLE_MOLAR_MASSES)).toBeCloseTo(100.09, 1);
  });
  it("an element with unknown mass → throws clearly, never silently wrong", () => {
    expect(() => calculateMolarMass({ Xx: 1 }, SAMPLE_MOLAR_MASSES)).toThrow();
  });
});

describe("crossCheckMolarMass", () => {
  it("a small deviation (<0.5%) → no warning", () => {
    expect(crossCheckMolarMass(18.015, 18.02).hasWarning).toBe(false);
  });
  it("a large deviation (>0.5%) → warns", () => {
    expect(crossCheckMolarMass(18.015, 20).hasWarning).toBe(true);
  });
  it("computes the correct % deviation", () => {
    expect(crossCheckMolarMass(101, 100).deviation).toBeCloseTo(0.01, 5);
  });
});

describe("molarMassBySymbolTable", () => {
  it("skips elements with a null mass (not yet measured)", () => {
    const table = molarMassBySymbolTable([
      { symbol: "H", atomicMass: 1.008 },
      { symbol: "Xx", atomicMass: null },
    ]);
    expect(table.get("H")).toBe(1.008);
    expect(table.has("Xx")).toBe(false);
  });
});
