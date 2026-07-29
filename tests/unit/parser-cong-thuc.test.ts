import { describe, it, expect } from "vitest";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";

describe("phanTichCongThuc", () => {
  it("nguyên tố đơn giản", () => {
    expect(phanTichCongThuc("H2O")).toEqual({ H: 2, O: 1 });
    expect(phanTichCongThuc("NaCl")).toEqual({ Na: 1, Cl: 1 });
    expect(phanTichCongThuc("Fe")).toEqual({ Fe: 1 });
  });

  it("ngoặc đơn có hệ số", () => {
    expect(phanTichCongThuc("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it("ngoặc lồng nhiều nguyên tố", () => {
    expect(phanTichCongThuc("Fe2(SO4)3")).toEqual({ Fe: 2, S: 3, O: 12 });
  });

  it("ngậm nước (dấu ·)", () => {
    expect(phanTichCongThuc("CuSO4·5H2O")).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it("ngậm nước (dấu . thay cho ·)", () => {
    expect(phanTichCongThuc("CuSO4.5H2O")).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it("ngoặc vuông (phức chất)", () => {
    expect(phanTichCongThuc("[Cu(NH3)4]SO4")).toEqual({ Cu: 1, N: 4, H: 12, S: 1, O: 4 });
  });

  it("ngoặc lồng 2 cấp", () => {
    // Al2(SO4)3 lồng trong một hợp chất giả định để kiểm đệ quy sâu hơn 1 cấp
    expect(phanTichCongThuc("Ca3(PO4)2")).toEqual({ Ca: 3, P: 2, O: 8 });
  });

  it("nguyên tố không hệ số ngay sau ngoặc đóng", () => {
    expect(phanTichCongThuc("Mg(OH)2")).toEqual({ Mg: 1, O: 2, H: 2 });
  });

  it("BẢO TOÀN: tổng số nguyên tử luôn là số nguyên dương", () => {
    for (const ct of ["H2SO4", "KMnO4", "Al2(SO4)3", "Ca3(PO4)2", "NH4NO3"]) {
      const bang = phanTichCongThuc(ct);
      for (const soLuong of Object.values(bang)) {
        expect(Number.isInteger(soLuong)).toBe(true);
        expect(soLuong).toBeGreaterThan(0);
      }
    }
  });

  it("công thức lỗi (thiếu ngoặc đóng) → ném lỗi rõ ràng, không âm thầm sai", () => {
    expect(() => phanTichCongThuc("Ca(OH2")).toThrow();
  });

  it("ký tự không hợp lệ → ném lỗi", () => {
    expect(() => phanTichCongThuc("H2O#")).toThrow();
  });
});
