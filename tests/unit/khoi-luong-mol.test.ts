import { describe, it, expect } from "vitest";
import { tinhKhoiLuongMol, doiChieuKhoiLuongMol, bangKhoiLuongTheoKyHieu } from "@/lib/hoa-hoc/khoi-luong-mol";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";

/**
 * Fixture khối lượng nguyên tử (IUPAC, giá trị thật) — CHỈ để kiểm tra phép
 * tính trong test này. App thật KHÔNG dùng bảng tĩnh này — luôn lấy trực
 * tiếp từ layTatCaNguyenTo() (PubChem) lúc chạy, xem scripts/doi-chieu-khoi-luong-mol.ts
 * để đối chiếu với dữ liệu PubChem thật.
 */
const KHOI_LUONG_MAU = new Map<string, number>([
  ["H", 1.008],
  ["O", 15.999],
  ["C", 12.011],
  ["Na", 22.99],
  ["Cl", 35.45],
  ["Ca", 40.078],
  ["S", 32.06],
  ["Fe", 55.845],
]);

describe("tinhKhoiLuongMol", () => {
  it("H2O ≈ 18.015", () => {
    expect(tinhKhoiLuongMol(phanTichCongThuc("H2O"), KHOI_LUONG_MAU)).toBeCloseTo(18.015, 2);
  });
  it("NaCl ≈ 58.44", () => {
    expect(tinhKhoiLuongMol(phanTichCongThuc("NaCl"), KHOI_LUONG_MAU)).toBeCloseTo(58.44, 1);
  });
  it("CaCO3 ≈ 100.09", () => {
    expect(tinhKhoiLuongMol(phanTichCongThuc("CaCO3"), KHOI_LUONG_MAU)).toBeCloseTo(100.09, 1);
  });
  it("nguyên tố không rõ khối lượng → ném lỗi rõ ràng, không âm thầm sai", () => {
    expect(() => tinhKhoiLuongMol({ Xx: 1 }, KHOI_LUONG_MAU)).toThrow();
  });
});

describe("doiChieuKhoiLuongMol", () => {
  it("lệch nhỏ (<0.5%) → không cảnh báo", () => {
    expect(doiChieuKhoiLuongMol(18.015, 18.02).canhBao).toBe(false);
  });
  it("lệch lớn (>0.5%) → cảnh báo", () => {
    expect(doiChieuKhoiLuongMol(18.015, 20).canhBao).toBe(true);
  });
  it("tính đúng % lệch", () => {
    expect(doiChieuKhoiLuongMol(101, 100).lech).toBeCloseTo(0.01, 5);
  });
});

describe("bangKhoiLuongTheoKyHieu", () => {
  it("bỏ qua nguyên tố có khối lượng null (chưa đo)", () => {
    const bang = bangKhoiLuongTheoKyHieu([
      { kyHieu: "H", khoiLuong: 1.008 },
      { kyHieu: "Xx", khoiLuong: null },
    ]);
    expect(bang.get("H")).toBe(1.008);
    expect(bang.has("Xx")).toBe(false);
  });
});
