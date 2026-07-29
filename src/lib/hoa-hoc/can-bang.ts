/**
 * Cân bằng phương trình hoá học bằng đại số tuyến tính.
 *
 * Dựng ma trận A (hàng = nguyên tố, cột = chất; vế phải mang dấu âm), giải hệ
 * thuần nhất A·x = 0 bằng khử Gauss-Jordan TRÊN SỐ HỮU TỈ (bigint tu/mẫu,
 * tránh sai số dấu phẩy động), rồi chuẩn hoá nghiệm về bộ số nguyên dương nhỏ
 * nhất bằng BCNN/UCLN. Thuật toán kinh điển, tất định, kiểm chứng được 100%.
 * KHÔNG dùng AI.
 *
 * Dùng BigInt(0)/BigInt(1) thay vì cú pháp chữ 0n/1n — tsconfig.json của repo
 * này target ES2017, cũ hơn mức ES2020 cần cho cú pháp chữ BigInt.
 */
import { phanTichCongThuc } from "./parser-cong-thuc";

const SO_0 = BigInt(0);
const SO_1 = BigInt(1);

function ucln(a: bigint, b: bigint): bigint {
  a = a < SO_0 ? -a : a;
  b = b < SO_0 ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function bcnn(a: bigint, b: bigint): bigint {
  if (a === SO_0 || b === SO_0) return SO_0;
  return (a / ucln(a, b)) * b;
}

/** Phân số bigint, luôn tự rút gọn và giữ mẫu số dương */
class PhanSo {
  readonly tu: bigint;
  readonly mau: bigint;

  constructor(tu: bigint, mau: bigint = SO_1) {
    if (mau === SO_0) throw new Error("Mẫu số bằng 0");
    if (mau < SO_0) {
      tu = -tu;
      mau = -mau;
    }
    const d = ucln(tu, mau);
    this.tu = d === SO_0 ? SO_0 : tu / d;
    this.mau = d === SO_0 ? mau : mau / d;
  }

  static tuSo(n: number | bigint): PhanSo {
    return new PhanSo(BigInt(n), SO_1);
  }

  cong(k: PhanSo): PhanSo {
    return new PhanSo(this.tu * k.mau + k.tu * this.mau, this.mau * k.mau);
  }
  tru(k: PhanSo): PhanSo {
    return new PhanSo(this.tu * k.mau - k.tu * this.mau, this.mau * k.mau);
  }
  nhan(k: PhanSo): PhanSo {
    return new PhanSo(this.tu * k.tu, this.mau * k.mau);
  }
  chia(k: PhanSo): PhanSo {
    if (k.tu === SO_0) throw new Error("Chia cho 0");
    return new PhanSo(this.tu * k.mau, this.mau * k.tu);
  }
  am(): PhanSo {
    return new PhanSo(-this.tu, this.mau);
  }
  bang0(): boolean {
    return this.tu === SO_0;
  }
}

/**
 * Giải hệ thuần nhất A·x = 0 bằng Gauss-Jordan, trả về nghiệm nguyên dương
 * nhỏ nhất nếu không gian nghiệm đúng 1 chiều (bậc tự do = 1) — điều kiện cần
 * cho MỘT phương trình hoá học cân bằng được. null nếu không thoả (không có
 * nghiệm khác 0, hoặc không gian nghiệm không xác định duy nhất).
 */
function giaiHeThuanNhat(aBanDau: PhanSo[][], soCot: number): bigint[] | null {
  const hang = aBanDau.map((r) => [...r]);
  const soHang = hang.length;
  let hangHienTai = 0;
  const cotPivot: number[] = [];

  for (let cot = 0; cot < soCot && hangHienTai < soHang; cot++) {
    let hangPivot = -1;
    for (let r = hangHienTai; r < soHang; r++) {
      if (!hang[r][cot].bang0()) {
        hangPivot = r;
        break;
      }
    }
    if (hangPivot === -1) continue;

    [hang[hangHienTai], hang[hangPivot]] = [hang[hangPivot], hang[hangHienTai]];

    const piv = hang[hangHienTai][cot];
    hang[hangHienTai] = hang[hangHienTai].map((x) => x.chia(piv));

    for (let r = 0; r < soHang; r++) {
      if (r === hangHienTai) continue;
      const heSo = hang[r][cot];
      if (heSo.bang0()) continue;
      hang[r] = hang[r].map((x, c) => x.tru(heSo.nhan(hang[hangHienTai][c])));
    }

    cotPivot.push(cot);
    hangHienTai++;
  }

  const cotTuDo: number[] = [];
  for (let c = 0; c < soCot; c++) if (!cotPivot.includes(c)) cotTuDo.push(c);
  if (cotTuDo.length !== 1) return null;

  const cotTd = cotTuDo[0];
  const x: PhanSo[] = new Array(soCot).fill(PhanSo.tuSo(0));
  x[cotTd] = PhanSo.tuSo(1);
  cotPivot.forEach((cot, i) => {
    x[cot] = hang[i][cotTd].am();
  });

  let mauChung = SO_1;
  for (const ps of x) mauChung = bcnn(mauChung, ps.mau) || mauChung;

  let nguyen = x.map((ps) => ps.tu * (mauChung / ps.mau));
  if (nguyen.some((n) => n < SO_0)) nguyen = nguyen.map((n) => -n);
  if (nguyen.some((n) => n <= SO_0)) return null; // dấu lẫn lộn — không phải nghiệm hoá học hợp lệ

  const uoc = nguyen.reduce((a, b) => ucln(a, b), SO_0);
  if (uoc > SO_1) nguyen = nguyen.map((n) => n / uoc);

  return nguyen;
}

export type KetQuaCanBang =
  | { ok: true; heSoTrai: number[]; heSoPhai: number[] }
  | { ok: false; lyDo: string };

export function canBang(veTrai: string[], vePhai: string[]): KetQuaCanBang {
  if (veTrai.length === 0 || vePhai.length === 0) {
    return { ok: false, lyDo: "Cần ít nhất một chất ở mỗi vế." };
  }

  let bangTrai: Record<string, number>[];
  let bangPhai: Record<string, number>[];
  try {
    bangTrai = veTrai.map(phanTichCongThuc);
    bangPhai = vePhai.map(phanTichCongThuc);
  } catch (e) {
    return { ok: false, lyDo: e instanceof Error ? e.message : "Công thức không hợp lệ." };
  }

  const tatCaNguyenTo = [...new Set([...bangTrai, ...bangPhai].flatMap((b) => Object.keys(b)))];
  const soCot = veTrai.length + vePhai.length;

  const A: PhanSo[][] = tatCaNguyenTo.map((nt) => {
    const hang: PhanSo[] = [];
    bangTrai.forEach((b) => hang.push(PhanSo.tuSo(b[nt] ?? 0)));
    bangPhai.forEach((b) => hang.push(PhanSo.tuSo(-(b[nt] ?? 0))));
    return hang;
  });

  const nghiem = giaiHeThuanNhat(A, soCot);
  if (!nghiem) {
    return {
      ok: false,
      lyDo: "Không tìm được hệ số nguyên dương duy nhất — kiểm tra lại công thức hoặc số chất ở hai vế.",
    };
  }

  const heSo = nghiem.map(Number);
  return {
    ok: true,
    heSoTrai: heSo.slice(0, veTrai.length),
    heSoPhai: heSo.slice(veTrai.length),
  };
}
