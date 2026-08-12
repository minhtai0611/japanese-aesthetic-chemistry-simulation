import { describe, expect, it } from "vitest";
import {
  bondAngleDegrees,
  rawDistance,
  actualDistanceAngstrom,
  calculateMeasurementResult,
  addAtomSelection,
  type PointXYZ,
} from "@/lib/measurement-geometry";

describe("rawDistance / actualDistanceAngstrom", () => {
  it("computes the correct Euclidean distance in scene units", () => {
    const a: PointXYZ = { x: 0, y: 0, z: 0 };
    const b: PointXYZ = { x: 0, y: 0, z: 3 };
    expect(rawDistance(a, b)).toBeCloseTo(3, 10);
  });

  it("correctly divides back out the scale factor to recover the real distance (Å)", () => {
    const a: PointXYZ = { x: 0, y: 0, z: 0 };
    const b: PointXYZ = { x: 0.62, y: 0, z: 0 }; // a real 1 Å, shrunk by 0.62
    expect(actualDistanceAngstrom(a, b, 0.62)).toBeCloseTo(1, 10);
  });
});

describe("bondAngleDegrees", () => {
  it("a right angle (90°)", () => {
    const a: PointXYZ = { x: 1, y: 0, z: 0 };
    const b: PointXYZ = { x: 0, y: 0, z: 0 };
    const c: PointXYZ = { x: 0, y: 1, z: 0 };
    expect(bondAngleDegrees(a, b, c)).toBeCloseTo(90, 9);
  });

  it("nearly collinear (~180°)", () => {
    const a: PointXYZ = { x: -1, y: 0, z: 0 };
    const b: PointXYZ = { x: 0, y: 0, z: 0 };
    const c: PointXYZ = { x: 1, y: 0, z: 0 };
    expect(bondAngleDegrees(a, b, c)).toBeCloseTo(180, 9);
  });

  it("is independent of the coordinate scale factor (angle is invariant under uniform scaling)", () => {
    const scale = 0.62;
    const a: PointXYZ = { x: 1 * scale, y: 0, z: 0 };
    const b: PointXYZ = { x: 0, y: 0, z: 0 };
    const c: PointXYZ = { x: 0, y: 1 * scale, z: 0 };
    expect(bondAngleDegrees(a, b, c)).toBeCloseTo(90, 9);
  });
});

describe("addAtomSelection", () => {
  it("accumulates up to 3 selections in click order", () => {
    let selected = addAtomSelection([], 5);
    expect(selected).toEqual([5]);
    selected = addAtomSelection(selected, 2);
    expect(selected).toEqual([5, 2]);
    selected = addAtomSelection(selected, 9);
    expect(selected).toEqual([5, 2, 9]);
  });

  it("a 4th click starts over from a new selection", () => {
    const selected = addAtomSelection([5, 2, 9], 7);
    expect(selected).toEqual([7]);
  });

  it("re-clicking an already-selected atom is a no-op", () => {
    const selected = addAtomSelection([5, 2], 5);
    expect(selected).toEqual([5, 2]);
  });
});

describe("calculateMeasurementResult", () => {
  const atoms: PointXYZ[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0.62, y: 0, z: 0 },
    { x: 0.62, y: 0.62, z: 0 },
  ];

  it("2 selections → a distance result", () => {
    const r = calculateMeasurementResult(atoms, [0, 1]);
    expect(r).toEqual({ kind: "khoangCach", a: 0, b: 1, angstrom: expect.closeTo(1, 6) });
  });

  it("3 selections → an angle result, vertex is the middle selection", () => {
    const r = calculateMeasurementResult(atoms, [0, 1, 2]);
    expect(r?.kind).toBe("goc");
    if (r?.kind === "goc") expect(r.degrees).toBeCloseTo(90, 6);
  });

  it("a selection count other than 2 or 3 → null", () => {
    expect(calculateMeasurementResult(atoms, [0])).toBeNull();
    expect(calculateMeasurementResult(atoms, [])).toBeNull();
  });
});

describe("cross-checked against real caffeine data (CID 2519)", () => {
  // Coordinates of caffeine's first 10 atoms, taken DIRECTLY from PubChem
  // PUG-REST (record_type=3d, CID 2519) on 2026-08-02, with the centroid
  // subtracted and multiplied by the same scale factor COORD_SCALE_3D=0.62
  // used by the real fetchCompound3D pipeline — no network call in this test
  // (per the existing test-isolation convention, see
  // tests/unit/thermodynamics.test.ts).
  const caffeine: PointXYZ[] = [
    { x: 0.252, y: 1.5659, z: 0.0002 }, // 0: O
    { x: -1.9782, y: -0.3018, z: -0.0004 }, // 1: O
    { x: -0.64, y: -0.8405, z: -0.0002 }, // 2: N
    { x: 1.3359, y: 0.0608, z: -0.0004 }, // 3: N
    { x: -0.8749, y: 0.6426, z: -0.0002 }, // 4: N
    { x: 0.8359, y: -1.2278, z: -0.0001 }, // 5: N
    { x: 0.4925, y: 0.1339, z: -0.0007 }, // 6: C
    { x: 0.2022, y: -0.6632, z: -0.0004 }, // 7: C — the N(2)-C(7) single bond is real in PC_Compounds.bonds
    { x: -0.0204, y: 0.8549, z: -0.0006 }, // 8: C
    { x: -1.2212, y: -0.1815, z: -0.0004 }, // 9: C
  ];

  it("the imidazole ring's N–C single-bond distance falls in the reasonable range (1.30–1.50 Å)", () => {
    // The real bond in PC_Compounds.bonds (PubChem, 1-indexed): aid1=3,aid2=8,order=1
    // → 0-based indices: atom 2 (N) – atom 7 (C).
    const distance = actualDistanceAngstrom(caffeine[2], caffeine[7]);
    expect(distance).toBeGreaterThan(1.3);
    expect(distance).toBeLessThan(1.5);
  });
});
