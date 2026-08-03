import { describe, expect, it } from "vitest";
import { layDienCucChuan } from "@/lib/hoa-hoc/the-dien-cuc-chuan";
import { tinhDienHoa } from "@/lib/hoa-hoc/nernst";

describe("layDienCucChuan", () => {
  it("trả đúng giá trị đã ghim (CRC/Wikipedia data page) cho vài nguyên tố", () => {
    expect(layDienCucChuan(29)).toEqual({ eV: 0.337, n: 2, nuaPhanUng: "Cu²⁺ + 2e⁻ → Cu" });
    expect(layDienCucChuan(30)?.eV).toBeCloseTo(-0.7618, 6);
    expect(layDienCucChuan(47)?.n).toBe(1);
  });

  it("trả null cho nguyên tố KHÔNG có trong bảng nguồn — không suy đoán", () => {
    expect(layDienCucChuan(6)).toBeNull(); // Carbon — không phải điện cực kim loại
    expect(layDienCucChuan(118)).toBeNull(); // Og
  });
});

describe("tinhDienHoa — pin Daniell (Zn/Cu), tiêu chuẩn nghiệm thu", () => {
  // Zn (Z=30, E°=-0.7618V, n=2) là anode; Cu (Z=29, E°=+0.337V, n=2) là cathode.
  // Đã tính tay: E°_cell = 0.337 - (-0.7618) = 1.0988V ≈ +1.10V;
  // n_tổng = BCNN(2,2) = 2; ΔG° = -2×96485×1.0988/1000 ≈ -212.04 kJ/mol.
  const ZN = 30;
  const CU = 29;

  it("chọn đúng anode/cathode theo E° chuẩn, bất kể thứ tự tham số truyền vào", () => {
    const kq1 = tinhDienHoa(ZN, CU);
    const kq2 = tinhDienHoa(CU, ZN);
    expect(kq1?.soAnode).toBe(ZN);
    expect(kq1?.soCathode).toBe(CU);
    expect(kq2?.soAnode).toBe(ZN);
    expect(kq2?.soCathode).toBe(CU);
  });

  it("E_cell và ΔG° khớp giá trị đã tính tay ở nồng độ chuẩn 1.0M/298.15K", () => {
    const kq = tinhDienHoa(ZN, CU, 1.0, 1.0);
    expect(kq).not.toBeNull();
    expect(kq!.eoCell).toBeCloseTo(1.0988, 4);
    expect(kq!.eCell).toBeCloseTo(1.0988, 4);
    expect(kq!.deltaG0).toBeCloseTo(-212.04, 1);
    expect(kq!.tuXayRa).toBe(true);
  });

  it("nồng độ khác 1.0M làm lệch E_cell theo Nernst (không đổi E°_cell)", () => {
    const kq = tinhDienHoa(ZN, CU, 0.1, 1.0);
    expect(kq!.eoCell).toBeCloseTo(1.0988, 4); // E° chuẩn không đổi theo nồng độ
    expect(kq!.eCell).not.toBeCloseTo(1.0988, 3); // E thực tế đổi
  });
});

describe("tinhDienHoa — hai điện cực số electron KHÁC nhau (kiểm BCNN)", () => {
  // Cu (Z=29, E°=+0.337V, n=2) là anode; Ag (Z=47, E°=+0.7996V, n=1) là cathode.
  // E°_cell = 0.7996 - 0.337 = 0.4626V; n_tổng = BCNN(2,1) = 2 (KHÔNG phải 1) —
  // nếu code dùng nhầm n=1, ΔG° sẽ sai một nửa so với giá trị đã tính tay dưới đây.
  it("dùng BCNN(n_anode, n_cathode) chứ không phải n của một điện cực", () => {
    const kq = tinhDienHoa(29, 47, 1.0, 1.0);
    expect(kq!.soAnode).toBe(29);
    expect(kq!.soCathode).toBe(47);
    expect(kq!.eoCell).toBeCloseTo(0.4626, 4);
    // ΔG° = -2 × 96485 × 0.4626 / 1000 ≈ -89.27 kJ/mol (n_tổng = BCNN(2,1) = 2)
    expect(kq!.deltaG0).toBeCloseTo(-89.27, 1);
  });
});

describe("tinhDienHoa — điện cực Hydro (SHE) cố định", () => {
  it("bỏ qua nồng độ truyền vào cho điện cực H — luôn giữ đúng 0V", () => {
    const kq = tinhDienHoa(1, 29, 5.0, 1.0); // nồng độ H = 5.0 (vô lý về mặt UI, nhưng hàm phải bỏ qua)
    expect(kq!.soAnode).toBe(1);
    expect(kq!.eAnode).toBe(0);
    expect(kq!.eCathode).toBeCloseTo(0.337, 6);
  });
});

describe("tinhDienHoa — trường hợp không hợp lệ", () => {
  it("trả null nếu một điện cực thiếu dữ liệu E° đã ghim", () => {
    expect(tinhDienHoa(6, 29)).toBeNull(); // Carbon không có trong bảng
  });

  it("trả null nếu hai điện cực trùng nhau", () => {
    expect(tinhDienHoa(29, 29)).toBeNull();
  });
});
