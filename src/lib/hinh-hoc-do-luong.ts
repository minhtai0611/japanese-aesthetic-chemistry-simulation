import { TY_LE_TOA_DO_3D } from "./ty-le-toa-do-3d";

/** Điểm 3 chiều tối giản — không phụ thuộc THREE.Vector3 để module này test được
 * bằng Vitest thuần (environment: "node"), không cần dựng WebGL/jsdom. */
export interface DiemXYZ {
  x: number;
  y: number;
  z: number;
}

/** Khoảng cách Euclid trong đơn vị khung cảnh three.js (đã co theo TY_LE_TOA_DO_3D). */
export function khoangCachGoc(a: DiemXYZ, b: DiemXYZ): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Khoảng cách thật (Å) — chia ngược lại hệ số co để khôi phục tọa độ conformer
 * PubChem gốc. Mặc định dùng đúng hệ số mà layHopChat3D đã áp dụng. */
export function khoangCachThatAngstrom(a: DiemXYZ, b: DiemXYZ, heSoTyLe: number = TY_LE_TOA_DO_3D): number {
  return khoangCachGoc(a, b) / heSoTyLe;
}

/**
 * Góc liên kết A-B-C tại đỉnh B (độ), bằng tích vô hướng của hai vector BA, BC.
 * Góc KHÔNG phụ thuộc hệ số co tọa độ (tỉ lệ đều theo mọi trục) — không cần
 * chia lại TY_LE_TOA_DO_3D ở đây, khác với khoảng cách.
 */
export function gocLienKetDo(a: DiemXYZ, b: DiemXYZ, c: DiemXYZ): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const doDaiBA = Math.hypot(ba.x, ba.y, ba.z);
  const doDaiBC = Math.hypot(bc.x, bc.y, bc.z);
  if (doDaiBA < 1e-9 || doDaiBC < 1e-9) return NaN;
  const tich = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const cosGoc = Math.min(1, Math.max(-1, tich / (doDaiBA * doDaiBC)));
  return (Math.acos(cosGoc) * 180) / Math.PI;
}

export type ChonNguyenTu = number[];

/**
 * Chu trình chọn nguyên tử để đo: tối đa 3 lựa chọn (A, B=đỉnh, C).
 * Đã chọn đủ 3 → lần bấm thứ 4 bắt đầu lại từ một lựa chọn mới.
 * Bấm lại nguyên tử đã chọn → bỏ qua (tránh cặp/tam giác suy biến).
 */
export function themLuaChonNguyenTu(hienTai: ChonNguyenTu, chiSo: number): ChonNguyenTu {
  if (hienTai.includes(chiSo)) return hienTai;
  if (hienTai.length >= 3) return [chiSo];
  return [...hienTai, chiSo];
}

export type KetQuaDoLuong =
  | { loai: "khoangCach"; a: number; b: number; angstrom: number }
  | { loai: "goc"; a: number; b: number; c: number; do: number }
  | null;

/** Tính kết quả đo từ danh sách nguyên tử (tọa độ đã co theo TY_LE_TOA_DO_3D) + lựa chọn hiện tại. */
export function tinhKetQuaDoLuong(nguyenTu: DiemXYZ[], daChon: ChonNguyenTu): KetQuaDoLuong {
  if (daChon.length === 2) {
    const [a, b] = daChon;
    const A = nguyenTu[a];
    const B = nguyenTu[b];
    if (!A || !B) return null;
    return { loai: "khoangCach", a, b, angstrom: khoangCachThatAngstrom(A, B) };
  }
  if (daChon.length === 3) {
    const [a, b, c] = daChon;
    const A = nguyenTu[a];
    const B = nguyenTu[b];
    const C = nguyenTu[c];
    if (!A || !B || !C) return null;
    return { loai: "goc", a, b, c, do: gocLienKetDo(A, B, C) };
  }
  return null;
}
