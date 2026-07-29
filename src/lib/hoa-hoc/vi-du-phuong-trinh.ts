/**
 * Phương trình mẫu đã kiểm chứng cân bằng được — dùng chung cho phòng cân bằng
 * (gợi ý bấm nhanh) và bộ sinh đề bài tập (src/lib/de-thi/sinh-de.ts), để cả
 * hai nơi luôn dùng đúng cùng một danh sách đã xác thực.
 */
export interface ViDuPhuongTrinh {
  trai: string;
  phai: string;
}

export const VI_DU_PHUONG_TRINH: readonly ViDuPhuongTrinh[] = [
  { trai: "H2 + O2", phai: "H2O" },
  { trai: "Fe + O2", phai: "Fe2O3" },
  { trai: "C3H8 + O2", phai: "CO2 + H2O" },
  { trai: "KMnO4 + HCl", phai: "KCl + MnCl2 + Cl2 + H2O" },
  { trai: "Ca(OH)2 + H3PO4", phai: "Ca3(PO4)2 + H2O" },
];
