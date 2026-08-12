import { describe, it, expect } from "vitest";
import { parseFormula } from "@/lib/chemistry/formula-parser";

describe("parseFormula", () => {
  it("simple elements", () => {
    expect(parseFormula("H2O")).toEqual({ H: 2, O: 1 });
    expect(parseFormula("NaCl")).toEqual({ Na: 1, Cl: 1 });
    expect(parseFormula("Fe")).toEqual({ Fe: 1 });
  });

  it("parentheses with a coefficient", () => {
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it("parentheses containing multiple elements", () => {
    expect(parseFormula("Fe2(SO4)3")).toEqual({ Fe: 2, S: 3, O: 12 });
  });

  it("hydration (· mark)", () => {
    expect(parseFormula("CuSO4·5H2O")).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it("hydration (. in place of ·)", () => {
    expect(parseFormula("CuSO4.5H2O")).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it("square brackets (complex ion)", () => {
    expect(parseFormula("[Cu(NH3)4]SO4")).toEqual({ Cu: 1, N: 4, H: 12, S: 1, O: 4 });
  });

  it("2-level nested parentheses", () => {
    // Al2(SO4)3 nested inside a hypothetical compound, to check recursion beyond 1 level deep
    expect(parseFormula("Ca3(PO4)2")).toEqual({ Ca: 3, P: 2, O: 8 });
  });

  it("an element with no coefficient right after a closing parenthesis", () => {
    expect(parseFormula("Mg(OH)2")).toEqual({ Mg: 1, O: 2, H: 2 });
  });

  it("CONSERVATION: the total atom count is always a positive integer", () => {
    for (const formula of ["H2SO4", "KMnO4", "Al2(SO4)3", "Ca3(PO4)2", "NH4NO3"]) {
      const table = parseFormula(formula);
      for (const count of Object.values(table)) {
        expect(Number.isInteger(count)).toBe(true);
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  it("a malformed formula (missing closing parenthesis) → throws clearly, never silently wrong", () => {
    expect(() => parseFormula("Ca(OH2")).toThrow();
  });

  it("an invalid character → throws", () => {
    expect(() => parseFormula("H2O#")).toThrow();
  });
});
