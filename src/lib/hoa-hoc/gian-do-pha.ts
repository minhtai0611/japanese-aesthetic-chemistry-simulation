/**
 * Giản đồ pha P-T (Áp suất – Nhiệt độ) qua phương trình Clausius-Clapeyron.
 *
 * PubChem periodictable/JSON KHÔNG có cột entanpi hóa hơi (ΔH_vap) — đã xác
 * nhận qua layTatCaNguyenTo (chỉ 17 cột: AtomicNumber...YearDiscovered, xem
 * `mem:06-pubchem-api`). Cần một bảng ghim nhỏ, giống pattern nhiet-dong.ts.
 *
 * Nguồn: CRC Handbook of Chemistry and Physics / Lange's Handbook of
 * Chemistry, đối chiếu qua Wikipedia "Heats of vaporization of the
 * elements" (data page), truy cập 2026-08-02. ΔH_vap tại điểm sôi thường
 * (1 atm, kJ/mol). Nguyên tố khí lưỡng nguyên tử (H, N, O, F, Cl, Br, I)
 * tính theo phân tử X₂ — khớp đơn vị với điểm sôi PubChem, vốn cũng đo cho
 * X₂ chứ không phải nguyên tử đơn lẻ. Thiếu nguyên tố nào → deltaHVapKJMol
 * trả null, KHÔNG suy đoán giá trị.
 *
 * CHỈ tính ranh giới LỎNG-KHÍ (đường sôi). KHÔNG định nghĩa điểm ba/điểm
 * tới hạn — không có nguồn dữ liệu đáng tin cậy cho các đại lượng đó trên
 * một tập nguyên tố rộng, và tiêu chuẩn nghiệm thu của giai đoạn này cũng
 * không kiểm chứng chúng. Điểm nóng chảy được giữ KHÔNG đổi theo áp suất
 * trong mô phỏng này (xấp xỉ — cần dữ liệu biến thiên thể tích khi nóng
 * chảy mà dự án không có; ranh giới rắn-lỏng thật gần như thẳng đứng với
 * hầu hết chất trong khoảng áp suất mô phỏng ở đây).
 */

/** R — hằng số khí lý tưởng, J/(mol·K) */
const HANG_SO_KHI = 8.314;

const BANG_DELTA_H_VAP_KJ_MOL: Readonly<Record<number, number>> = {
  1: 0.904, // H (H2)
  2: 0.0829, // He
  7: 5.57, // N (N2)
  8: 6.82, // O (O2)
  9: 6.62, // F (F2)
  10: 1.71, // Ne
  11: 97.42, // Na
  12: 128, // Mg
  13: 294, // Al
  17: 20.41, // Cl (Cl2)
  18: 6.43, // Ar
  19: 76.9, // K
  20: 154.7, // Ca
  26: 340, // Fe
  29: 300.4, // Cu
  30: 123.6, // Zn
  35: 29.96, // Br (Br2)
  47: 258, // Ag
  53: 41.57, // I (I2)
  79: 324, // Au
  80: 59.11, // Hg
  82: 179.5, // Pb
};

/**
 * ΔH_vap (kJ/mol) tại điểm sôi thường (1 atm) theo số hiệu nguyên tử, hoặc
 * null nếu nguyên tố đó không có trong bảng nguồn — caller phải coi null là
 * "không đủ dữ liệu để suy ra đường sôi ở áp suất khác 1 atm".
 */
export function deltaHVapKJMol(soHieuNguyenTu: number): number | null {
  return BANG_DELTA_H_VAP_KJ_MOL[soHieuNguyenTu] ?? null;
}

export interface DiemPha {
  apSuatAtm: number;
  nhietDoK: number;
}

/**
 * Clausius-Clapeyron, giả định ΔH_vap không đổi theo T/P (xấp xỉ hợp lý xa
 * điểm tới hạn, không chính xác gần đó):
 *   ln(P/P1) = -(ΔH_vap/R)(1/T - 1/T1)
 * Giải T theo P₁ = áp suất chuẩn đã biết điểm sôi (mặc định 1 atm).
 */
export function nhietDoSoiTheoApSuat(
  deltaHVapKJMolValue: number,
  tSoi1AtmK: number,
  apSuatMoiAtm: number,
  apSuatChuanAtm: number = 1,
): number {
  const deltaHVapJ = deltaHVapKJMolValue * 1000;
  const nghichDaoT =
    1 / tSoi1AtmK - (HANG_SO_KHI / deltaHVapJ) * Math.log(apSuatMoiAtm / apSuatChuanAtm);
  return 1 / nghichDaoT;
}

/**
 * Sinh dải điểm ranh giới lỏng-khí (áp suất lấy mẫu đều trên thang log) để
 * vẽ đường cong trên giản đồ P-T.
 */
export function duongRanhGioiLongKhi(
  deltaHVapKJMolValue: number,
  tSoi1AtmK: number,
  apSuatMinAtm: number = 0.01,
  apSuatMaxAtm: number = 100,
  soDiem: number = 60,
): DiemPha[] {
  const logMin = Math.log10(apSuatMinAtm);
  const logMax = Math.log10(apSuatMaxAtm);
  return Array.from({ length: soDiem + 1 }, (_, i) => {
    const logP = logMin + ((logMax - logMin) * i) / soDiem;
    const apSuatAtm = 10 ** logP;
    return {
      apSuatAtm,
      nhietDoK: nhietDoSoiTheoApSuat(deltaHVapKJMolValue, tSoi1AtmK, apSuatAtm),
    };
  });
}
