/**
 * Thế điện cực chuẩn (E°, quy ước khử, so với điện cực hydro chuẩn SHE ở
 * 25°C/298.15K, hoạt độ ion = 1).
 *
 * PubChem KHÔNG có cột này — cần bảng ghim nhỏ, giống pattern
 * gian-do-pha.ts/nhiet-dong.ts. Nguồn: Wikipedia "Standard electrode
 * potential (data page)", biên soạn từ CRC Handbook of Chemistry and
 * Physics / Electrochemical Series (Vanýsek), truy cập 2026-08-03. Thiếu
 * nguyên tố nào → layDienCucChuan trả null, KHÔNG suy đoán.
 *
 * H (Z=1) là điện cực hydro chuẩn (SHE) — điện cực quy chiếu CỐ ĐỊNH ở
 * 0V. Mô phỏng này không tính áp suất khí H₂, nên nếu người dùng chọn H
 * làm điện cực, UI phải khoá thanh trượt nồng độ cho điện cực đó (xem
 * phong-pin-dien-hoa.tsx) thay vì áp Nernst lên nó.
 */

export interface DienCucChuan {
  /** E° (V), quy ước khử, so với SHE */
  eV: number;
  /** Số electron trao đổi trong nửa phản ứng khử */
  n: number;
  /** Nửa phản ứng khử, để hiển thị */
  nuaPhanUng: string;
}

const BANG_THE_DIEN_CUC_CHUAN: Readonly<Record<number, DienCucChuan>> = {
  3: { eV: -3.04, n: 1, nuaPhanUng: "Li⁺ + e⁻ → Li" },
  19: { eV: -2.942, n: 1, nuaPhanUng: "K⁺ + e⁻ → K" },
  20: { eV: -2.84, n: 2, nuaPhanUng: "Ca²⁺ + 2e⁻ → Ca" },
  11: { eV: -2.713, n: 1, nuaPhanUng: "Na⁺ + e⁻ → Na" },
  12: { eV: -2.356, n: 2, nuaPhanUng: "Mg²⁺ + 2e⁻ → Mg" },
  13: { eV: -1.676, n: 3, nuaPhanUng: "Al³⁺ + 3e⁻ → Al" },
  30: { eV: -0.7618, n: 2, nuaPhanUng: "Zn²⁺ + 2e⁻ → Zn" },
  26: { eV: -0.44, n: 2, nuaPhanUng: "Fe²⁺ + 2e⁻ → Fe" },
  28: { eV: -0.257, n: 2, nuaPhanUng: "Ni²⁺ + 2e⁻ → Ni" },
  50: { eV: -0.13, n: 2, nuaPhanUng: "Sn²⁺ + 2e⁻ → Sn" },
  82: { eV: -0.126, n: 2, nuaPhanUng: "Pb²⁺ + 2e⁻ → Pb" },
  1: { eV: 0, n: 2, nuaPhanUng: "2H⁺ + 2e⁻ → H₂ (SHE, cố định)" },
  29: { eV: 0.337, n: 2, nuaPhanUng: "Cu²⁺ + 2e⁻ → Cu" },
  47: { eV: 0.7996, n: 1, nuaPhanUng: "Ag⁺ + e⁻ → Ag" },
  80: { eV: 0.85, n: 2, nuaPhanUng: "Hg²⁺ + 2e⁻ → Hg" },
  79: { eV: 1.52, n: 3, nuaPhanUng: "Au³⁺ + 3e⁻ → Au" },
};

/**
 * Thế điện cực chuẩn theo số hiệu nguyên tử, hoặc null nếu nguyên tố đó
 * không có trong bảng nguồn — caller phải coi null là "không đủ dữ liệu để
 * dùng làm điện cực trong buồng điện hóa này".
 */
export function layDienCucChuan(soHieuNguyenTu: number): DienCucChuan | null {
  return BANG_THE_DIEN_CUC_CHUAN[soHieuNguyenTu] ?? null;
}
