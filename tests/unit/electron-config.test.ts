import { describe, it, expect } from "vitest";
import { lopVoTuCauHinh } from "@/lib/electron-config";

/** Fixture rút từ PubChem thật — đủ để giải chuỗi lồng khí hiếm 5 cấp */
const CFG = new Map<string, { cauHinhElectron: string }>([
  ["He", { cauHinhElectron: "1s2" }],
  ["Ne", { cauHinhElectron: "[He]2s2 2p6" }],
  ["Ar", { cauHinhElectron: "[Ne]3s2 3p6" }],
  ["Kr", { cauHinhElectron: "[Ar]4s2 3d10 4p6" }],
  ["Xe", { cauHinhElectron: "[Kr]5s2 4d10 5p6" }],
  ["Rn", { cauHinhElectron: "[Xe]6s2 4f14 5d10 6p6" }],
]);

describe("lopVoTuCauHinh", () => {
  it.each([
    ["1s1", [1], 1], // H
    ["[Ar]4s2 3d6", [2, 8, 14, 2], 26], // Fe
    ["[Kr]5s0 4d10", [2, 8, 18, 18], 46], // Pd — ngoại lệ: lớp 5 rỗng
    ["[Ar]4s1 3d5", [2, 8, 13, 1], 24], // Cr — ngoại lệ half-filled
    ["[Ar]4s1 3d10", [2, 8, 18, 1], 29], // Cu
    ["[Xe]6s1 4f14 5d10", [2, 8, 18, 32, 18, 1], 79], // Au
    ["[Rn]7s2 5f3 6d1", [2, 8, 18, 32, 21, 9, 2], 92], // U
  ])("%s → %j (tổng = Z = %i)", (cfg, expected, z) => {
    const lop = lopVoTuCauHinh(cfg, CFG);
    expect(lop).toEqual(expected);
    expect(lop.reduce((a, b) => a + b, 0)).toBe(z);
  });

  it("HỒI QUY: chuỗi lồng [Rn] sâu 5 cấp KHÔNG được trả mảng rỗng (bug cũ)", () => {
    const og = lopVoTuCauHinh("[Rn]7s2 7p6 5f14 6d10 (predicted)", CFG);
    expect(og.length).toBeGreaterThan(0);
    expect(og.reduce((a, b) => a + b, 0)).toBe(118);
    expect(og).toEqual([2, 8, 18, 32, 32, 18, 8]);
  });

  it("ký hiệu không giải được → không lặp vô hạn", () => {
    expect(() => lopVoTuCauHinh("[Zz]1s1", CFG)).not.toThrow();
  });

  it("chuỗi rỗng → mảng rỗng", () => {
    expect(lopVoTuCauHinh("", CFG)).toEqual([]);
  });
});
