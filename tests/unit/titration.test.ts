import { describe, it, expect } from "vitest";
import { titrationPH, equivalenceVolume, isEquivalencePoint } from "@/lib/chemistry/titration";

describe("titrationPH — strong acid / strong base", () => {
  it("pure 0.1M HCl → pH = 1", () => {
    expect(titrationPH(0.1, 25, 0.1, 0)).toBeCloseTo(1.0, 2);
  });
  it("the equivalence point → pH = 7", () => {
    expect(titrationPH(0.1, 25, 0.1, 25)).toBeCloseTo(7.0, 2);
  });
  it("a large base excess → pH ≈ 12.3", () => {
    expect(titrationPH(0.1, 25, 0.1, 50)).toBeCloseTo(12.52, 1);
  });
  it("PROPERTY: every valid slider combination gives a pH within [0, 14]", () => {
    for (let ca = 0.02; ca <= 1; ca += 0.07)
      for (let cb = 0.02; cb <= 1; cb += 0.07)
        for (const va of [10, 25, 50]) {
          const veq = (ca * va) / cb;
          const vmax = Math.min(Math.max(veq * 2.4, va), 800);
          for (let k = 0; k <= 20; k++) {
            const p = titrationPH(ca, va, cb, (vmax * k) / 20);
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(14);
          }
        }
  });
});

describe("isEquivalencePoint — label window", () => {
  it("BUG: must NOT report 'pH = 7' when the real pH has already dropped to ~3", () => {
    // Ca=Cb=0.1M, Va=25mL → Veq=25mL. The old window (±0.5mL) was wrong at vb=24.6..24.99
    expect(isEquivalencePoint(0.1, 25, 0.1, 24.6)).toBe(false);
    expect(titrationPH(0.1, 25, 0.1, 24.6)).toBeCloseTo(3.09, 1);
  });
  it("reports true exactly at the equivalence point", () => {
    expect(isEquivalencePoint(0.1, 25, 0.1, 25)).toBe(true);
  });
  it("the window must be narrow: a 1% volume deviation is already false", () => {
    expect(isEquivalencePoint(0.1, 25, 0.1, 25 * 1.02)).toBe(false);
  });
  it("the window is wide enough for arithmetic error: a 0.1% volume deviation is still true", () => {
    expect(isEquivalencePoint(0.1, 25, 0.1, 25 * 1.001)).toBe(true);
  });
});

describe("equivalenceVolume", () => {
  it("Ca*Va = Cb*Veq", () => {
    expect(equivalenceVolume(0.1, 25, 0.1)).toBeCloseTo(25, 5);
    expect(equivalenceVolume(0.2, 25, 0.1)).toBeCloseTo(50, 5);
  });
});
