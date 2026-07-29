import { describe, it, expect } from "vitest";
import { canBang } from "@/lib/hoa-hoc/can-bang";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";

describe("canBang — hệ số chính xác cho phương trình kinh điển", () => {
  it.each([
    [["H2", "O2"], ["H2O"], [2, 1], [2]],
    [["Fe", "O2"], ["Fe2O3"], [4, 3], [2]],
    [["C3H8", "O2"], ["CO2", "H2O"], [1, 5], [3, 4]],
    [["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"], [2, 16], [2, 2, 5, 8]],
    [["Ca(OH)2", "H3PO4"], ["Ca3(PO4)2", "H2O"], [3, 2], [1, 6]],
  ])("%j = %j → trái %j, phải %j", (veTrai, vePhai, heSoTrai, heSoPhai) => {
    const kq = canBang(veTrai as string[], vePhai as string[]);
    expect(kq.ok).toBe(true);
    if (kq.ok) {
      expect(kq.heSoTrai).toEqual(heSoTrai);
      expect(kq.heSoPhai).toEqual(heSoPhai);
    }
  });

  it("từ chối phương trình không cân bằng được (khác nguyên tố hai vế)", () => {
    expect(canBang(["H2"], ["O2"]).ok).toBe(false);
  });

  it("từ chối công thức rỗng ở một vế", () => {
    expect(canBang([], ["H2O"]).ok).toBe(false);
    expect(canBang(["H2O"], []).ok).toBe(false);
  });

  it("từ chối công thức không hợp lệ, kèm lý do rõ ràng", () => {
    const kq = canBang(["H2(O"], ["H2O"]);
    expect(kq.ok).toBe(false);
    if (!kq.ok) expect(kq.lyDo.length).toBeGreaterThan(0);
  });
});

/**
 * 50 phương trình thật của chương trình hoá học phổ thông Việt Nam — tổ hợp,
 * phân huỷ, thế đơn/kép, đốt cháy, axit–bazơ, oxi hoá khử. Không hard-code hệ
 * số kỳ vọng (dễ sai số tay khi chép lại) — property test bên dưới xác nhận
 * MỌI kết quả đều thật sự bảo toàn nguyên tố ở cả hai vế, đó là định nghĩa
 * đúng của "cân bằng đúng".
 */
const PHUONG_TRINH_MAU: [string[], string[]][] = [
  [["H2", "O2"], ["H2O"]],
  [["N2", "H2"], ["NH3"]],
  [["Fe", "O2"], ["Fe2O3"]],
  [["Al", "O2"], ["Al2O3"]],
  [["Na", "O2"], ["Na2O"]],
  [["Ca", "O2"], ["CaO"]],
  [["Mg", "O2"], ["MgO"]],
  [["C", "O2"], ["CO2"]],
  [["S", "O2"], ["SO2"]],
  [["P", "O2"], ["P2O5"]],
  [["CH4", "O2"], ["CO2", "H2O"]],
  [["C2H6", "O2"], ["CO2", "H2O"]],
  [["C3H8", "O2"], ["CO2", "H2O"]],
  [["C4H10", "O2"], ["CO2", "H2O"]],
  [["C2H4", "O2"], ["CO2", "H2O"]],
  [["C2H2", "O2"], ["CO2", "H2O"]],
  [["C6H6", "O2"], ["CO2", "H2O"]],
  [["C2H5OH", "O2"], ["CO2", "H2O"]],
  [["CaCO3"], ["CaO", "CO2"]],
  [["KClO3"], ["KCl", "O2"]],
  [["KMnO4"], ["K2MnO4", "MnO2", "O2"]],
  [["H2O2"], ["H2O", "O2"]],
  [["NaHCO3"], ["Na2CO3", "H2O", "CO2"]],
  [["NH4NO3"], ["N2O", "H2O"]],
  [["Fe", "HCl"], ["FeCl2", "H2"]],
  [["Zn", "HCl"], ["ZnCl2", "H2"]],
  [["Al", "HCl"], ["AlCl3", "H2"]],
  [["Mg", "H2SO4"], ["MgSO4", "H2"]],
  [["Na", "H2O"], ["NaOH", "H2"]],
  [["Ca", "H2O"], ["Ca(OH)2", "H2"]],
  [["NaOH", "HCl"], ["NaCl", "H2O"]],
  [["KOH", "H2SO4"], ["K2SO4", "H2O"]],
  [["Ca(OH)2", "HCl"], ["CaCl2", "H2O"]],
  [["Ba(OH)2", "HCl"], ["BaCl2", "H2O"]],
  [["Al(OH)3", "H2SO4"], ["Al2(SO4)3", "H2O"]],
  [["Ca(OH)2", "H3PO4"], ["Ca3(PO4)2", "H2O"]],
  [["NaOH", "CO2"], ["Na2CO3", "H2O"]],
  [["Ca(OH)2", "CO2"], ["CaCO3", "H2O"]],
  [["BaCl2", "Na2SO4"], ["BaSO4", "NaCl"]],
  [["AgNO3", "NaCl"], ["AgCl", "NaNO3"]],
  [["CaCl2", "Na2CO3"], ["CaCO3", "NaCl"]],
  [["Pb(NO3)2", "KI"], ["PbI2", "KNO3"]],
  [["CuSO4", "NaOH"], ["Cu(OH)2", "Na2SO4"]],
  [["FeCl3", "NaOH"], ["Fe(OH)3", "NaCl"]],
  [["Fe", "CuSO4"], ["FeSO4", "Cu"]],
  [["Zn", "AgNO3"], ["Zn(NO3)2", "Ag"]],
  [["Cu", "AgNO3"], ["Cu(NO3)2", "Ag"]],
  [["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"]],
  [["K2Cr2O7", "HCl"], ["KCl", "CrCl3", "Cl2", "H2O"]],
  [["Fe2O3", "CO"], ["Fe", "CO2"]],
  [["Fe3O4", "CO"], ["Fe", "CO2"]],
  [["CuO", "H2"], ["Cu", "H2O"]],
];

describe("canBang — 50 phương trình mẫu (THPT Việt Nam)", () => {
  it(`đủ ${PHUONG_TRINH_MAU.length} phương trình mẫu`, () => {
    expect(PHUONG_TRINH_MAU.length).toBeGreaterThanOrEqual(50);
  });

  it.each(PHUONG_TRINH_MAU)("cân bằng được: %j = %j", (veTrai, vePhai) => {
    const kq = canBang(veTrai, vePhai);
    expect(kq.ok).toBe(true);
  });

  it("BẢO TOÀN NGUYÊN TỐ: mọi kết quả cân bằng thật sự bằng nhau ở hai vế", () => {
    for (const [veTrai, vePhai] of PHUONG_TRINH_MAU) {
      const kq = canBang(veTrai, vePhai);
      expect(kq.ok).toBe(true);
      if (!kq.ok) continue;

      const demTrai: Record<string, number> = {};
      veTrai.forEach((ct, i) => {
        const bang = phanTichCongThuc(ct);
        for (const [nt, sl] of Object.entries(bang)) {
          demTrai[nt] = (demTrai[nt] ?? 0) + sl * kq.heSoTrai[i];
        }
      });
      const demPhai: Record<string, number> = {};
      vePhai.forEach((ct, i) => {
        const bang = phanTichCongThuc(ct);
        for (const [nt, sl] of Object.entries(bang)) {
          demPhai[nt] = (demPhai[nt] ?? 0) + sl * kq.heSoPhai[i];
        }
      });

      expect(demTrai).toEqual(demPhai);
      // Mọi hệ số đều là số nguyên dương — không có nghiệm 0 hay âm lọt qua.
      for (const h of [...kq.heSoTrai, ...kq.heSoPhai]) {
        expect(Number.isInteger(h)).toBe(true);
        expect(h).toBeGreaterThan(0);
      }
    }
  });
});
