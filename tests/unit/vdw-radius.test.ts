import { describe, expect, it } from "vitest";
import { VDW_RADIUS_ANGSTROM, vanDerWaalsRadius } from "@/lib/vdw-radius";

describe("vanDerWaalsRadius", () => {
  it("returns the correct Alvarez 2013 value for common elements", () => {
    expect(vanDerWaalsRadius(1)).toBe(1.2); // H
    expect(vanDerWaalsRadius(6)).toBe(1.77); // C
    expect(vanDerWaalsRadius(7)).toBe(1.66); // N
    expect(vanDerWaalsRadius(8)).toBe(1.5); // O
    expect(vanDerWaalsRadius(16)).toBe(1.89); // S
    expect(vanDerWaalsRadius(17)).toBe(1.82); // Cl
  });

  it("returns null for an element NOT in the source table — value never guessed", () => {
    expect(vanDerWaalsRadius(43)).toBeNull(); // Tc — not in the table
    expect(vanDerWaalsRadius(118)).toBeNull(); // Og — superheavy, no measured VDW radius
  });

  it("every value in the table is a finite, positive number", () => {
    for (const radius of Object.values(VDW_RADIUS_ANGSTROM)) {
      expect(Number.isFinite(radius)).toBe(true);
      expect(radius).toBeGreaterThan(0);
    }
  });
});
