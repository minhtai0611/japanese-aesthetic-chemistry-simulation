import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseFormula } from "@/lib/chemistry/formula-parser";

// fetchCompound calls real PubChem — mocked to test the fallback ordering
// (pinned table → Materials Project → no data) without a real network call,
// consistent with this project's rule that only network-touching functions
// get live/curl checks — no unit test in the Vitest suite touches a real
// network, keeping the suite green/deterministic.
vi.mock("@/lib/pubchem", () => ({
  fetchCompound: vi.fn(),
}));

import { fetchCompound } from "@/lib/pubchem";
import { getSubstanceData, calculateReactionThermodynamics } from "@/lib/chemistry/thermodynamics";

const fetchCompoundMock = fetchCompound as unknown as ReturnType<typeof vi.fn>;

describe("getSubstanceData — source priority order", () => {
  beforeEach(() => {
    fetchCompoundMock.mockReset();
    vi.unstubAllGlobals();
    process.env.MATERIALS_PROJECT_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("substance in the pinned table: returns immediately, does NOT call PubChem/network", async () => {
    const r = await getSubstanceData("H2O", parseFormula("H2O"));
    expect(r).toEqual({ deltaH: -285.8, deltaG: -237.1, source: "ghim", cid: null });
    expect(fetchCompoundMock).not.toHaveBeenCalled();
  });

  it("element in its standard state: ΔH°f = ΔG°f = 0, from the pinned table", async () => {
    const r = await getSubstanceData("O2", parseFormula("O2"));
    expect(r).toEqual({ deltaH: 0, deltaG: 0, source: "ghim", cid: null });
  });

  it("not in the pinned table, PubChem doesn't recognize the formula: returns null", async () => {
    fetchCompoundMock.mockResolvedValue(null);
    const r = await getSubstanceData("Xx99Zz", { Xx: 99, Zz: 1 });
    expect(r).toBeNull();
  });

  it("not in the pinned table, PubChem recognizes it, Materials Project has a stable entry: DFT source, ΔG null", async () => {
    fetchCompoundMock.mockResolvedValue({ cid: 14833 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ formation_energy_per_atom: -1.5 }] }),
      }),
    );
    const r = await getSubstanceData("MgO", { Mg: 1, O: 1 });
    expect(r?.source).toBe("materials-project-dft");
    expect(r?.deltaG).toBeNull();
    expect(r?.cid).toBe(14833);
    // -1.5 eV/atom × 2 atoms × 96.485 kJ/mol/eV
    expect(r?.deltaH).toBeCloseTo(-1.5 * 2 * 96.485, 3);
  });

  it("PubChem recognizes the formula but Materials Project has no/errored data: returns null (never guessed)", async () => {
    fetchCompoundMock.mockResolvedValue({ cid: 999 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }));
    const r = await getSubstanceData("KMnO4", parseFormula("KMnO4"));
    expect(r).toBeNull();
  });

  it("missing MATERIALS_PROJECT_API_KEY: does not call Materials Project, returns null", async () => {
    delete process.env.MATERIALS_PROJECT_API_KEY;
    fetchCompoundMock.mockResolvedValue({ cid: 14833 });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await getSubstanceData("MgO", { Mg: 1, O: 1 });
    expect(r).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("calculateReactionThermodynamics — Hess's law on balanced coefficients", () => {
  beforeEach(() => {
    fetchCompoundMock.mockReset();
    vi.unstubAllGlobals();
    process.env.MATERIALS_PROJECT_API_KEY = "test-key";
  });

  it("2H2 + O2 -> 2H2O (entirely from the pinned table): exothermic, spontaneous at 298K, no DFT", async () => {
    const r = await calculateReactionThermodynamics(
      ["H2", "O2"],
      [parseFormula("H2"), parseFormula("O2")],
      [2, 1],
      ["H2O"],
      [parseFormula("H2O")],
      [2],
    );
    expect(r.hasData).toBe(true);
    if (r.hasData) {
      expect(r.deltaH).toBeCloseTo(-571.6, 1); // 2×(-285.8) - 0
      expect(r.deltaH).toBeLessThan(0);
      expect(r.deltaG).toBeCloseTo(-474.2, 1); // 2×(-237.1) - 0
      expect(r.hasDftSource).toBe(false);
    }
  });

  it("a reaction with a DFT-only substance (Mg, MgO not in the pinned table): ΔH computable (mixing pinned+DFT), ΔG null, hasDftSource true", async () => {
    fetchCompoundMock.mockResolvedValue({ cid: 14833 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ formation_energy_per_atom: -1.5 }] }),
      }),
    );
    // 2Mg + O2 -> 2MgO. O2 is from the pinned table (ΔH°f=0); neither Mg nor
    // MgO is in the pinned table, so both go through Materials Project (mock
    // returns -1.5 eV/atom for both).
    const r = await calculateReactionThermodynamics(
      ["Mg", "O2"],
      [parseFormula("Mg"), parseFormula("O2")],
      [2, 1],
      ["MgO"],
      [parseFormula("MgO")],
      [2],
    );
    expect(r.hasData).toBe(true);
    if (r.hasData) {
      const deltaHMg = -1.5 * 1 * 96.485;
      const deltaHMgO = -1.5 * 2 * 96.485;
      expect(r.deltaH).toBeCloseTo(2 * deltaHMgO - (2 * deltaHMg + 0), 5);
      expect(r.deltaG).toBeNull();
      expect(r.hasDftSource).toBe(true);
    }
  });

  it("missing data for any substance: correctly reports the missing substance's name, doesn't compute", async () => {
    fetchCompoundMock.mockResolvedValue(null);
    const r = await calculateReactionThermodynamics(
      ["Al", "O2"],
      [parseFormula("Al"), parseFormula("O2")],
      [4, 3],
      ["Al2O3"],
      [parseFormula("Al2O3")],
      [2],
    );
    expect(r.hasData).toBe(false);
    if (!r.hasData) expect(r.missingSubstances).toEqual(["Al", "Al2O3"]);
  });
});
