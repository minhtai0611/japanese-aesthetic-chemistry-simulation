import { describe, expect, it } from "vitest";
import { getStandardElectrodePotential } from "@/lib/chemistry/standard-electrode-potential";
import { calculateElectrochemistry } from "@/lib/chemistry/nernst";

describe("getStandardElectrodePotential", () => {
  it("returns the correct pinned value (CRC/Wikipedia data page) for a few elements", () => {
    expect(getStandardElectrodePotential(29)).toEqual({ eV: 0.337, n: 2, halfReaction: "Cu²⁺ + 2e⁻ → Cu" });
    expect(getStandardElectrodePotential(30)?.eV).toBeCloseTo(-0.7618, 6);
    expect(getStandardElectrodePotential(47)?.n).toBe(1);
  });

  it("returns null for an element NOT in the source table — never guessed", () => {
    expect(getStandardElectrodePotential(6)).toBeNull(); // Carbon — not a metal electrode
    expect(getStandardElectrodePotential(118)).toBeNull(); // Og
  });
});

describe("calculateElectrochemistry — Daniell cell (Zn/Cu), acceptance case", () => {
  // Zn (Z=30, E°=-0.7618V, n=2) is the anode; Cu (Z=29, E°=+0.337V, n=2) is the cathode.
  // Hand-computed: E°_cell = 0.337 - (-0.7618) = 1.0988V ≈ +1.10V;
  // n_total = LCM(2,2) = 2; ΔG° = -2×96485×1.0988/1000 ≈ -212.04 kJ/mol.
  const ZN = 30;
  const CU = 29;

  it("picks the correct anode/cathode by standard E°, regardless of parameter order", () => {
    const r1 = calculateElectrochemistry(ZN, CU);
    const r2 = calculateElectrochemistry(CU, ZN);
    expect(r1?.anodeAtomicNumber).toBe(ZN);
    expect(r1?.cathodeAtomicNumber).toBe(CU);
    expect(r2?.anodeAtomicNumber).toBe(ZN);
    expect(r2?.cathodeAtomicNumber).toBe(CU);
  });

  it("E_cell and ΔG° match hand-computed values at standard concentration 1.0M/298.15K", () => {
    const r = calculateElectrochemistry(ZN, CU, 1.0, 1.0);
    expect(r).not.toBeNull();
    expect(r!.eoCell).toBeCloseTo(1.0988, 4);
    expect(r!.eCell).toBeCloseTo(1.0988, 4);
    expect(r!.deltaG0).toBeCloseTo(-212.04, 1);
    expect(r!.isSpontaneous).toBe(true);
  });

  it("a concentration other than 1.0M shifts E_cell via Nernst (E°_cell stays fixed)", () => {
    const r = calculateElectrochemistry(ZN, CU, 0.1, 1.0);
    expect(r!.eoCell).toBeCloseTo(1.0988, 4); // standard E° doesn't change with concentration
    expect(r!.eCell).not.toBeCloseTo(1.0988, 3); // actual E does change
  });
});

describe("calculateElectrochemistry — two electrodes with DIFFERENT electron counts (LCM check)", () => {
  // Cu (Z=29, E°=+0.337V, n=2) is the anode; Ag (Z=47, E°=+0.7996V, n=1) is the cathode.
  // E°_cell = 0.7996 - 0.337 = 0.4626V; n_total = LCM(2,1) = 2 (NOT 1) —
  // if the code mistakenly used n=1, ΔG° would be off by half from the hand-computed value below.
  it("uses LCM(n_anode, n_cathode), not the n of a single electrode", () => {
    const r = calculateElectrochemistry(29, 47, 1.0, 1.0);
    expect(r!.anodeAtomicNumber).toBe(29);
    expect(r!.cathodeAtomicNumber).toBe(47);
    expect(r!.eoCell).toBeCloseTo(0.4626, 4);
    // ΔG° = -2 × 96485 × 0.4626 / 1000 ≈ -89.27 kJ/mol (n_total = LCM(2,1) = 2)
    expect(r!.deltaG0).toBeCloseTo(-89.27, 1);
  });
});

describe("calculateElectrochemistry — fixed Hydrogen electrode (SHE)", () => {
  it("ignores the concentration passed for the H electrode — always stays exactly 0V", () => {
    const r = calculateElectrochemistry(1, 29, 5.0, 1.0); // H concentration = 5.0 (nonsensical in the UI, but the function must ignore it)
    expect(r!.anodeAtomicNumber).toBe(1);
    expect(r!.eAnode).toBe(0);
    expect(r!.eCathode).toBeCloseTo(0.337, 6);
  });
});

describe("calculateElectrochemistry — invalid cases", () => {
  it("returns null if one electrode is missing pinned E° data", () => {
    expect(calculateElectrochemistry(6, 29)).toBeNull(); // Carbon isn't in the table
  });

  it("returns null if the two electrodes are identical", () => {
    expect(calculateElectrochemistry(29, 29)).toBeNull();
  });
});
