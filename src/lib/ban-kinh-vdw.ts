/**
 * BÁN KÍNH VAN DER WAALS THẬT — nguồn: Alvarez, S. "A cartography of the van
 * der Waals territories." Dalton Trans., 2013, 42, 8617–8636 (DOI:
 * 10.1039/c3dt50599e) — bảng hợp nhất, bao phủ tới Z=96 (Cm), đối chiếu chéo
 * với Bondi, A. J. Phys. Chem. 1964, 68, 441–451 (bảng kinh điển, dừng ở
 * Z≈86 và thiếu nhiều nguyên tố phổ biến trong hóa hữu cơ/vô cơ).
 *
 * Đây là hằng số hình học đã công bố (không đổi theo thời gian, không phải
 * số liệu "đo lường" cần đối chiếu nhiều nguồn như src/lib/hoa-hoc/nhiet-dong.ts) —
 * nhưng KHÔNG được suy đoán giá trị cho nguyên tố thiếu trong bảng gốc.
 * Đơn vị: Ångström (Å) — đơn vị gốc của bảng nguồn, không quy đổi.
 */
export const BAN_KINH_VDW_ANGSTROM: Readonly<Record<number, number>> = {
  1: 1.2, // H
  2: 1.43, // He
  3: 2.12, // Li
  4: 1.98, // Be
  5: 1.91, // B
  6: 1.77, // C
  7: 1.66, // N
  8: 1.5, // O
  9: 1.46, // F
  10: 1.58, // Ne
  11: 2.5, // Na
  12: 2.51, // Mg
  13: 2.25, // Al
  14: 2.19, // Si
  15: 1.9, // P
  16: 1.89, // S
  17: 1.82, // Cl
  18: 1.83, // Ar
  19: 2.73, // K
  20: 2.62, // Ca
  26: 2.04, // Fe
  29: 1.96, // Cu
  30: 2.01, // Zn
  35: 1.86, // Br
  47: 2.1, // Ag
  53: 2.06, // I
  78: 2.13, // Pt
  79: 2.14, // Au
  80: 2.23, // Hg
  82: 2.02, // Pb
};

/**
 * Trả về bán kính VDW thật (Å) theo số hiệu nguyên tử, hoặc null nếu nguyên
 * tố đó KHÔNG có trong bảng nguồn Alvarez 2013 — caller phải coi null là
 * "không đủ dữ liệu để vẽ vỏ VDW cho nguyên tử này", không tự đoán giá trị.
 */
export function banKinhVanDerWaals(soHieuNguyenTu: number): number | null {
  return BAN_KINH_VDW_ANGSTROM[soHieuNguyenTu] ?? null;
}
