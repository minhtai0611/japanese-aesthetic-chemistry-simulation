import { describe, it, expect } from "vitest";
import { electronShellConfig } from "@/lib/electron-config";

/** Fixture drawn from real PubChem — enough to resolve a 5-level-deep noble-gas nesting chain */
const CFG = new Map<string, { electronConfig: string }>([
  ["He", { electronConfig: "1s2" }],
  ["Ne", { electronConfig: "[He]2s2 2p6" }],
  ["Ar", { electronConfig: "[Ne]3s2 3p6" }],
  ["Kr", { electronConfig: "[Ar]4s2 3d10 4p6" }],
  ["Xe", { electronConfig: "[Kr]5s2 4d10 5p6" }],
  ["Rn", { electronConfig: "[Xe]6s2 4f14 5d10 6p6" }],
]);

describe("electronShellConfig", () => {
  it.each([
    ["1s1", [1], 1], // H
    ["[Ar]4s2 3d6", [2, 8, 14, 2], 26], // Fe
    ["[Kr]5s0 4d10", [2, 8, 18, 18], 46], // Pd — exception: empty shell 5
    ["[Ar]4s1 3d5", [2, 8, 13, 1], 24], // Cr — half-filled exception
    ["[Ar]4s1 3d10", [2, 8, 18, 1], 29], // Cu
    ["[Xe]6s1 4f14 5d10", [2, 8, 18, 32, 18, 1], 79], // Au
    ["[Rn]7s2 5f3 6d1", [2, 8, 18, 32, 21, 9, 2], 92], // U
  ])("%s → %j (total = Z = %i)", (cfg, expected, z) => {
    const shells = electronShellConfig(cfg, CFG);
    expect(shells).toEqual(expected);
    expect(shells.reduce((a, b) => a + b, 0)).toBe(z);
  });

  it("REGRESSION: a 5-level-deep [Rn] nesting chain must NOT return an empty array (old bug)", () => {
    const og = electronShellConfig("[Rn]7s2 7p6 5f14 6d10 (predicted)", CFG);
    expect(og.length).toBeGreaterThan(0);
    expect(og.reduce((a, b) => a + b, 0)).toBe(118);
    expect(og).toEqual([2, 8, 18, 32, 32, 18, 8]);
  });

  it("an unresolvable symbol → doesn't loop forever", () => {
    expect(() => electronShellConfig("[Zz]1s1", CFG)).not.toThrow();
  });

  it("empty string → empty array", () => {
    expect(electronShellConfig("", CFG)).toEqual([]);
  });
});
