import { describe, it, expect } from "vitest";
import { balanceEquation } from "@/lib/chemistry/equilibrium";
import { parseFormula } from "@/lib/chemistry/formula-parser";

describe("balanceEquation — exact coefficients for classic equations", () => {
  it.each([
    [["H2", "O2"], ["H2O"], [2, 1], [2]],
    [["Fe", "O2"], ["Fe2O3"], [4, 3], [2]],
    [["C3H8", "O2"], ["CO2", "H2O"], [1, 5], [3, 4]],
    [["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"], [2, 16], [2, 2, 5, 8]],
    [["Ca(OH)2", "H3PO4"], ["Ca3(PO4)2", "H2O"], [3, 2], [1, 6]],
  ])("%j = %j → left %j, right %j", (left, right, leftCoefficients, rightCoefficients) => {
    const result = balanceEquation(left as string[], right as string[]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.leftCoefficients).toEqual(leftCoefficients);
      expect(result.rightCoefficients).toEqual(rightCoefficients);
    }
  });

  it("rejects an equation that can't be balanced (different elements on each side)", () => {
    expect(balanceEquation(["H2"], ["O2"]).ok).toBe(false);
  });

  it("rejects an empty formula list on one side", () => {
    expect(balanceEquation([], ["H2O"]).ok).toBe(false);
    expect(balanceEquation(["H2O"], []).ok).toBe(false);
  });

  it("rejects an invalid formula, with a clear reason", () => {
    const result = balanceEquation(["H2(O"], ["H2O"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });
});

/**
 * 50 real equations from the Vietnamese high-school chemistry curriculum —
 * combination, decomposition, single/double displacement, combustion,
 * acid–base, redox. Expected coefficients are NOT hard-coded (easy to get
 * wrong when transcribing by hand) — the property test below instead
 * verifies that EVERY result truly conserves elements on both sides, which
 * is the correct definition of "balanced correctly".
 */
const SAMPLE_EQUATIONS: [string[], string[]][] = [
  [["H2", "O2"], ["H2O"]],
  [["N2", "H2"], ["NH3"]],
  [["Fe", "O2"], ["Fe2O3"]],
  [["Al", "O2"], ["Al2O3"]],
  [["Na", "O2"], ["Na2O"]],
  [["Ca", "O2"], ["CaO"]],
  [["Mg", "O2"], ["MgO"]],
  [["C", "O2"], ["CO2"]],
  [["S", "O2"], ["SO2"]],
  [["P", "O2"], ["P2O5"]],
  [["CH4", "O2"], ["CO2", "H2O"]],
  [["C2H6", "O2"], ["CO2", "H2O"]],
  [["C3H8", "O2"], ["CO2", "H2O"]],
  [["C4H10", "O2"], ["CO2", "H2O"]],
  [["C2H4", "O2"], ["CO2", "H2O"]],
  [["C2H2", "O2"], ["CO2", "H2O"]],
  [["C6H6", "O2"], ["CO2", "H2O"]],
  [["C2H5OH", "O2"], ["CO2", "H2O"]],
  [["CaCO3"], ["CaO", "CO2"]],
  [["KClO3"], ["KCl", "O2"]],
  [["KMnO4"], ["K2MnO4", "MnO2", "O2"]],
  [["H2O2"], ["H2O", "O2"]],
  [["NaHCO3"], ["Na2CO3", "H2O", "CO2"]],
  [["NH4NO3"], ["N2O", "H2O"]],
  [["Fe", "HCl"], ["FeCl2", "H2"]],
  [["Zn", "HCl"], ["ZnCl2", "H2"]],
  [["Al", "HCl"], ["AlCl3", "H2"]],
  [["Mg", "H2SO4"], ["MgSO4", "H2"]],
  [["Na", "H2O"], ["NaOH", "H2"]],
  [["Ca", "H2O"], ["Ca(OH)2", "H2"]],
  [["NaOH", "HCl"], ["NaCl", "H2O"]],
  [["KOH", "H2SO4"], ["K2SO4", "H2O"]],
  [["Ca(OH)2", "HCl"], ["CaCl2", "H2O"]],
  [["Ba(OH)2", "HCl"], ["BaCl2", "H2O"]],
  [["Al(OH)3", "H2SO4"], ["Al2(SO4)3", "H2O"]],
  [["Ca(OH)2", "H3PO4"], ["Ca3(PO4)2", "H2O"]],
  [["NaOH", "CO2"], ["Na2CO3", "H2O"]],
  [["Ca(OH)2", "CO2"], ["CaCO3", "H2O"]],
  [["BaCl2", "Na2SO4"], ["BaSO4", "NaCl"]],
  [["AgNO3", "NaCl"], ["AgCl", "NaNO3"]],
  [["CaCl2", "Na2CO3"], ["CaCO3", "NaCl"]],
  [["Pb(NO3)2", "KI"], ["PbI2", "KNO3"]],
  [["CuSO4", "NaOH"], ["Cu(OH)2", "Na2SO4"]],
  [["FeCl3", "NaOH"], ["Fe(OH)3", "NaCl"]],
  [["Fe", "CuSO4"], ["FeSO4", "Cu"]],
  [["Zn", "AgNO3"], ["Zn(NO3)2", "Ag"]],
  [["Cu", "AgNO3"], ["Cu(NO3)2", "Ag"]],
  [["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"]],
  [["K2Cr2O7", "HCl"], ["KCl", "CrCl3", "Cl2", "H2O"]],
  [["Fe2O3", "CO"], ["Fe", "CO2"]],
  [["Fe3O4", "CO"], ["Fe", "CO2"]],
  [["CuO", "H2"], ["Cu", "H2O"]],
];

describe("balanceEquation — 50 sample equations (Vietnamese high school)", () => {
  it(`has at least ${SAMPLE_EQUATIONS.length} sample equations`, () => {
    expect(SAMPLE_EQUATIONS.length).toBeGreaterThanOrEqual(50);
  });

  it.each(SAMPLE_EQUATIONS)("balances: %j = %j", (left, right) => {
    const result = balanceEquation(left, right);
    expect(result.ok).toBe(true);
  });

  it("CONSERVES ELEMENTS: every balanced result is truly equal on both sides", () => {
    for (const [left, right] of SAMPLE_EQUATIONS) {
      const result = balanceEquation(left, right);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      const leftCounts: Record<string, number> = {};
      left.forEach((formula, i) => {
        const table = parseFormula(formula);
        for (const [element, count] of Object.entries(table)) {
          leftCounts[element] = (leftCounts[element] ?? 0) + count * result.leftCoefficients[i];
        }
      });
      const rightCounts: Record<string, number> = {};
      right.forEach((formula, i) => {
        const table = parseFormula(formula);
        for (const [element, count] of Object.entries(table)) {
          rightCounts[element] = (rightCounts[element] ?? 0) + count * result.rightCoefficients[i];
        }
      });

      expect(leftCounts).toEqual(rightCounts);
      // Every coefficient is a positive integer — no zero or negative solution slips through.
      for (const c of [...result.leftCoefficients, ...result.rightCoefficients]) {
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThan(0);
      }
    }
  });
});
