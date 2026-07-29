/**
 * Tính khối lượng mol từ công thức đã phân tích, rồi ĐỐI CHIẾU với giá trị
 * PubChem — biến chính nguồn dữ liệu thành bộ kiểm tra cho code của mình,
 * nhất quán với triết lý "0 điểm dữ liệu tự chế" của dự án.
 *
 * QUAN TRỌNG: khối lượng nguyên tử KHÔNG hard-code ở đây — luôn lấy từ
 * layTatCaNguyenTo() (PubChem) lúc chạy, qua bangKhoiLuongTheoKyHieu().
 */
import type { NguyenTo } from "@/lib/pubchem";

export function bangKhoiLuongTheoKyHieu(
  nguyenTo: readonly Pick<NguyenTo, "kyHieu" | "khoiLuong">[],
): Map<string, number> {
  const bang = new Map<string, number>();
  for (const n of nguyenTo) {
    if (n.khoiLuong != null) bang.set(n.kyHieu, n.khoiLuong);
  }
  return bang;
}

export function tinhKhoiLuongMol(
  bangNguyenTu: Record<string, number>,
  khoiLuongTheoKyHieu: Map<string, number>,
): number {
  let tong = 0;
  for (const [kyHieu, soLuong] of Object.entries(bangNguyenTu)) {
    const m = khoiLuongTheoKyHieu.get(kyHieu);
    if (m == null) {
      throw new Error(`Không rõ khối lượng nguyên tử của "${kyHieu}" — kiểm tra lại ký hiệu hoá học.`);
    }
    tong += m * soLuong;
  }
  return tong;
}

export interface KetQuaDoiChieu {
  mTinh: number;
  mPubChem: number;
  lech: number;
  canhBao: boolean;
}

/** Sai lệch > 0.5% ⇒ cảnh báo — công thức hoặc bảng khối lượng có vấn đề */
export function doiChieuKhoiLuongMol(mTinh: number, mPubChem: number): KetQuaDoiChieu {
  const lech = mPubChem === 0 ? 0 : Math.abs(mTinh - mPubChem) / mPubChem;
  return { mTinh, mPubChem, lech, canhBao: lech > 0.005 };
}
