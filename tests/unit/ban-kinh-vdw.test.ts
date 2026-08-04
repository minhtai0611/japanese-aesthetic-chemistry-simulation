import { describe, expect, it } from "vitest";
import { BAN_KINH_VDW_ANGSTROM, banKinhVanDerWaals } from "@/lib/ban-kinh-vdw";

describe("banKinhVanDerWaals", () => {
  it("trả đúng giá trị Alvarez 2013 cho các nguyên tố phổ biến", () => {
    expect(banKinhVanDerWaals(1)).toBe(1.2); // H
    expect(banKinhVanDerWaals(6)).toBe(1.77); // C
    expect(banKinhVanDerWaals(7)).toBe(1.66); // N
    expect(banKinhVanDerWaals(8)).toBe(1.5); // O
    expect(banKinhVanDerWaals(16)).toBe(1.89); // S
    expect(banKinhVanDerWaals(17)).toBe(1.82); // Cl
  });

  it("trả null cho nguyên tố KHÔNG có trong bảng nguồn — không suy đoán giá trị", () => {
    expect(banKinhVanDerWaals(43)).toBeNull(); // Tc — không có trong bảng
    expect(banKinhVanDerWaals(118)).toBeNull(); // Og — siêu nặng, không có VDW đo được
  });

  it("mọi giá trị trong bảng đều là số hữu hạn, dương", () => {
    for (const banKinh of Object.values(BAN_KINH_VDW_ANGSTROM)) {
      expect(Number.isFinite(banKinh)).toBe(true);
      expect(banKinh).toBeGreaterThan(0);
    }
  });
});
