import { describe, expect, it } from "vitest";
import { deltaHVaporizationKJMol, liquidGasBoundaryCurve, boilingPointFromPressure } from "@/lib/chemistry/phase-diagram";

describe("deltaHVaporizationKJMol", () => {
  it("returns the correct pinned value (CRC/Lange's, cross-checked against the Wikipedia data page) for a few elements", () => {
    expect(deltaHVaporizationKJMol(1)).toBeCloseTo(0.904, 6); // H (H2)
    expect(deltaHVaporizationKJMol(26)).toBeCloseTo(340, 6); // Fe
    expect(deltaHVaporizationKJMol(11)).toBeCloseTo(97.42, 6); // Na
  });

  it("returns null for an element NOT in the source table — never guessed", () => {
    expect(deltaHVaporizationKJMol(43)).toBeNull(); // Tc
    expect(deltaHVaporizationKJMol(118)).toBeNull(); // Og
  });
});

describe("boilingPointFromPressure — verified against Water (H2O)", () => {
  // Water's ΔH_vap at the normal boiling point = 40.65 kJ/mol, T1 = 373.15 K (100 °C, 1 atm)
  // — a standard NIST/CRC value, cross-checked during the research session before writing this test.
  const DELTA_H_VAP_WATER = 40.65;
  const BOILING_POINT_1ATM = 373.15;

  it("at 1 atm gives exactly 373.15 K (the reference point, unchanged)", () => {
    expect(boilingPointFromPressure(DELTA_H_VAP_WATER, BOILING_POINT_1ATM, 1)).toBeCloseTo(373.15, 6);
  });

  it("at 0.5 atm gives a LOWER boiling point, matching the real measured value (~354.4 K / 81.3 °C)", () => {
    const t = boilingPointFromPressure(DELTA_H_VAP_WATER, BOILING_POINT_1ATM, 0.5);
    expect(t).toBeLessThan(373.15);
    expect(t).toBeCloseTo(354.4, 0); // within 0.5 K of the real measured value
  });

  it("a pressure above 1 atm gives a HIGHER boiling point", () => {
    const t = boilingPointFromPressure(DELTA_H_VAP_WATER, BOILING_POINT_1ATM, 2);
    expect(t).toBeGreaterThan(373.15);
  });
});

describe("liquidGasBoundaryCurve", () => {
  it("generates exactly pointCount+1 points, monotonic in pressure, with the correct 2 endpoints", () => {
    const curve = liquidGasBoundaryCurve(40.65, 373.15, 0.01, 100, 60);
    expect(curve).toHaveLength(61);
    expect(curve[0].pressureAtm).toBeCloseTo(0.01, 6);
    expect(curve[curve.length - 1].pressureAtm).toBeCloseTo(100, 6);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].pressureAtm).toBeGreaterThan(curve[i - 1].pressureAtm);
      expect(curve[i].temperatureK).toBeGreaterThan(curve[i - 1].temperatureK);
    }
  });
});
