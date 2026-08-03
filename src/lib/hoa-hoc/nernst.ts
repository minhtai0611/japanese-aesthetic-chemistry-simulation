/**
 * Điện hóa: pin Galvanic (Daniell-cell-style), phương trình Nernst tổng
 * quát theo TỪNG nửa pin (đúng cả khi hai điện cực có số electron trao đổi
 * khác nhau — công thức đơn giản E_cell = E°_cat - E°_an - (RT/nF)ln([An]/[Cat])
 * trong bản kế hoạch gốc chỉ đúng khi hai điện cực CÙNG n).
 *
 * Với phản ứng khử M^n+ + n e⁻ → M(r), hoạt độ kim loại rắn = 1 nên
 * Q = 1/[M^n+], suy ra:
 *   E = E° + (RT / nF)·ln([M^n+])
 * rồi E_cell = E_cathode − E_anode. Khi n_anode = n_cathode = n, biểu thức
 * này rút gọn ĐÚNG về công thức đơn giản ở trên (xem plan file).
 *
 * ΔG° = −n_tổng·F·E°_cell, với n_tổng = BCNN(n_anode, n_cathode) — số
 * electron thực trao đổi trong phản ứng TỔNG QUÁT đã cân bằng, không phải
 * n riêng của một nửa phản ứng.
 *
 * H (Z=1, SHE) là điện cực quy chiếu CỐ ĐỊNH — không áp Nernst theo nồng
 * độ lên nó (xem the-dien-cuc-chuan.ts).
 */
import { layDienCucChuan } from "./the-dien-cuc-chuan";

const HANG_SO_KHI = 8.314; // R, J/(mol·K)
const HANG_SO_FARADAY = 96485; // F, C/mol
const SO_HIEU_HYDRO = 1;

function ucln(a: number, b: number): number {
  return b === 0 ? a : ucln(b, a % b);
}

function bcnn(a: number, b: number): number {
  return (a * b) / ucln(a, b);
}

export interface KetQuaDienHoa {
  soAnode: number;
  soCathode: number;
  /** Thế điện cực THỰC của anode sau khi áp Nernst theo nồng độ, V */
  eAnode: number;
  /** Thế điện cực THỰC của cathode sau khi áp Nernst theo nồng độ, V */
  eCathode: number;
  /** E°_cell chuẩn (nồng độ = 1M, 298.15K), V */
  eoCell: number;
  /** E_cell thực tế theo nồng độ đã cho, V */
  eCell: number;
  /** ΔG° của phản ứng tổng quát đã cân bằng, kJ/mol */
  deltaG0: number;
  /** true nếu E_cell (thực tế, theo nồng độ đã cho) > 0 */
  tuXayRa: boolean;
}

/**
 * Tính điện thế pin Galvanic từ hai số hiệu nguyên tử làm điện cực.
 * Trả null nếu thiếu dữ liệu E° đã ghim cho một trong hai, hoặc hai điện
 * cực trùng nhau (không phải một pin thật).
 */
export function tinhDienHoa(
  soDienCucA: number,
  soDienCucB: number,
  nongDoA: number = 1.0,
  nongDoB: number = 1.0,
  nhietDoKelvin: number = 298.15,
): KetQuaDienHoa | null {
  if (soDienCucA === soDienCucB) return null;
  const a = layDienCucChuan(soDienCucA);
  const b = layDienCucChuan(soDienCucB);
  if (!a || !b) return null;

  const aLaAnode = a.eV <= b.eV;
  const anodeSo = aLaAnode ? soDienCucA : soDienCucB;
  const anodeData = aLaAnode ? a : b;
  const nongDoAnode = aLaAnode ? nongDoA : nongDoB;
  const cathodeSo = aLaAnode ? soDienCucB : soDienCucA;
  const cathodeData = aLaAnode ? b : a;
  const nongDoCathode = aLaAnode ? nongDoB : nongDoA;

  const theDienCucThuc = (so: number, du: { eV: number; n: number }, nongDo: number) =>
    so === SO_HIEU_HYDRO
      ? du.eV
      : du.eV + ((HANG_SO_KHI * nhietDoKelvin) / (du.n * HANG_SO_FARADAY)) * Math.log(nongDo);

  const eAnode = theDienCucThuc(anodeSo, anodeData, nongDoAnode);
  const eCathode = theDienCucThuc(cathodeSo, cathodeData, nongDoCathode);
  const eoCell = cathodeData.eV - anodeData.eV;
  const eCell = eCathode - eAnode;
  const nTong = bcnn(anodeData.n, cathodeData.n);
  const deltaG0 = (-nTong * HANG_SO_FARADAY * eoCell) / 1000;

  return {
    soAnode: anodeSo,
    soCathode: cathodeSo,
    eAnode,
    eCathode,
    eoCell,
    eCell,
    deltaG0,
    tuXayRa: eCell > 0,
  };
}
