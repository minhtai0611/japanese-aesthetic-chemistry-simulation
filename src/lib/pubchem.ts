/**
 * LỚP DỮ LIỆU THẬT — PUBCHEM PUG-REST (NCBI, công cộng, không cần khóa API).
 *
 * TUYÊN BỐ MINH BẠCH: website này KHÔNG chế tác số liệu hóa học.
 *  - Bảng tuần hoàn 118 nguyên tố : /rest/pug/periodictable/JSON
 *  - Thuộc tính hợp chất          : /rest/pug/compound/.../property/...
 *  - Tọa độ không gian 3 chiều     : /rest/pug/compound/.../JSON?record_type=3d
 *  - Gợi ý tên                     : /rest/autocomplete/compound/{từ}/JSON
 * Các phép mô phỏng (pH, pha loãng, pha vật chất…) là toán vật lý/hóa học
 * tính TRÊN nền số liệu API này (Kw, n = m/M, C₁V₁ = C₂V₂, nhiệt độ chuyển pha).
 */

import { BO_TRI, TEN_VI, DICH_GIA_DINH } from "./nguyen-to";
import { lopVoTuCauHinh } from "./electron-config";
import { dichTenHopChat, goiYTenTiengViet } from "./alias-hop-chat";

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest";
const TUAN = 60 * 60 * 24 * 7; // cache 7 ngày

async function goiPug<T>(duong: string): Promise<T | null> {
  try {
    const res = await fetch(`${PUG}${duong}`, {
      next: { revalidate: TUAN },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Fault?: unknown } & T;
    if (json && typeof json === "object" && "Fault" in json) return null;
    return json;
  } catch {
    return null;
  }
}

/* ---------------------------------- NGUYÊN TỐ ---------------------------------- */

export interface NguyenTo {
  so: number;
  kyHieu: string;
  tenEn: string;
  tenVi: string;
  khoiLuong: number | null;        // u
  mauCPK: string;                  // "#RRGGBB"
  cauHinhElectron: string;
  doAmDien: number | null;         // Pauling
  banKinhPm: number | null;        // pm
  nangLuongIonHoa: number | null;  // eV
  aiLucElectron: number | null;    // eV
  cacMucOxiHoa: string;
  trangThaiGoc: string;            // dữ liệu nguyên gốc từ API
  trangThai: "ran" | "long" | "khi" | "chua-xac-dinh";
  /**
   * Độ chắc chắn của trạng thái chuẩn: PubChem tự đánh dấu các nguyên tố siêu nặng
   * tổng hợp, số lượng nguyên tử quá ít để đo trạng thái khối, bằng cụm "Expected to
   * be a ...". Field này giữ nguyên tín hiệu đó thay vì để UI hiển thị như một fact
   * đo đạc chắc chắn.
   */
  trangThaiCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  /**
   * Cấu hình electron của các nguyên tố cùng nhóm "chưa đo trạng thái khối" ở trên
   * cũng chưa từng được xác định bằng thực nghiệm quang phổ — chỉ có giá trị tính
   * toán lý thuyết. Suy ra từ CÙNG tín hiệu nguồn (trangThaiGoc), không phải số liệu
   * tự bịa.
   */
  cauHinhElectronCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  nongChayK: number | null;        // K
  soiK: number | null;             // K
  matDo: number | null;            // g/cm³
  giaDinhEn: string;
  giaDinhVi: string;
  namPhatHien: string;
  nhom: number;
  chuKi: number | null;
  chuKiHienThi: number;
  khoi: "s" | "p" | "d" | "f";
  lopVo: number[];                 // số e ở mỗi lớp n=1..7 (từ cấu hình API)
}

interface BangPeriodic {
  Table: {
    Columns: { Column: string[] };
    Row: { Cell: string[] }[];
  };
}

function soHoacNull(v: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function trangThaiCua(goc: string): NguyenTo["trangThai"] {
  const g = goc.toLowerCase();
  if (g.includes("solid")) return "ran";
  if (g.includes("liquid")) return "long";
  if (g.includes("gas")) return "khi";
  return "chua-xac-dinh";
}

/** PubChem đánh dấu suy đoán bằng cụm "Expected to be a ..." thay vì đo trực tiếp */
function doTinCayTuTrangThaiGoc(goc: string): NguyenTo["trangThaiCertainty"] {
  if (!goc) return "chua-xac-dinh";
  return /expected/i.test(goc) ? "du-doan" : "do-dac";
}

/**
 * Chuẩn hoá mã màu CPK từ PubChem.
 *
 * PubChem cắt số 0 đứng đầu: Paladi có màu Jmol chuẩn #006985 nhưng API trả "6985".
 * padStart(6, "F") biến nó thành "#FF6985" (hồng) — một mã màu không tồn tại trong
 * bất kỳ chuẩn CPK/Jmol nào. Phải đệm bằng "0".
 */
export function mauCPKTu(raw: string | undefined): { hex: string; nguon: "pubchem" | "mac-dinh" } {
  const v = (raw ?? "").trim();
  if (!/^[0-9A-Fa-f]{1,6}$/.test(v)) return { hex: "#C8C4BC", nguon: "mac-dinh" };
  return { hex: `#${v.toUpperCase().padStart(6, "0")}`, nguon: "pubchem" };
}

let demNguyenTo = 0;

export async function layTatCaNguyenTo(): Promise<NguyenTo[]> {
  const data = await goiPug<BangPeriodic>("/pug/periodictable/JSON");
  if (!data?.Table?.Row?.length) return [];

  const cot = data.Table.Columns.Column;
  const viTri = (ten: string) => cot.indexOf(ten);

  const tho = data.Table.Row.map((hang) => {
    const c = hang.Cell;
    const so = Number(c[viTri("AtomicNumber")]);
    const boTri = BO_TRI.get(so) ?? { nhom: 0, chuKiHienThi: 0, chuKi: null, khoi: "s" as const };
    const giaDinh = c[viTri("GroupBlock")] ?? "";
    return {
      so,
      kyHieu: c[viTri("Symbol")] ?? "",
      tenEn: c[viTri("Name")] ?? "",
      tenVi: TEN_VI[so] ?? c[viTri("Name")] ?? "",
      khoiLuong: soHoacNull(c[viTri("AtomicMass")]),
      mauCPK: mauCPKTu(c[viTri("CPKHexColor")]).hex,
      cauHinhElectron: c[viTri("ElectronConfiguration")] ?? "",
      doAmDien: soHoacNull(c[viTri("Electronegativity")]),
      banKinhPm: soHoacNull(c[viTri("AtomicRadius")]),
      nangLuongIonHoa: soHoacNull(c[viTri("IonizationEnergy")]),
      aiLucElectron: soHoacNull(c[viTri("ElectronAffinity")]),
      cacMucOxiHoa: c[viTri("OxidationStates")] || "—",
      trangThaiGoc: c[viTri("StandardState")] ?? "",
      trangThai: trangThaiCua(c[viTri("StandardState")] ?? ""),
      trangThaiCertainty: doTinCayTuTrangThaiGoc(c[viTri("StandardState")] ?? ""),
      cauHinhElectronCertainty: doTinCayTuTrangThaiGoc(c[viTri("StandardState")] ?? ""),
      nongChayK: soHoacNull(c[viTri("MeltingPoint")]),
      soiK: soHoacNull(c[viTri("BoilingPoint")]),
      matDo: soHoacNull(c[viTri("Density")]),
      giaDinhEn: giaDinh,
      giaDinhVi: DICH_GIA_DINH[giaDinh] ?? giaDinh,
      namPhatHien: c[viTri("YearDiscovered")] || "—",
      nhom: boTri.nhom,
      chuKi: boTri.chuKi,
      chuKiHienThi: boTri.chuKiHienThi,
      khoi: boTri.khoi,
      lopVo: [] as number[],
    };
  });

  const theoKyHieu = new Map(tho.map((n) => [n.kyHieu, n]));
  tho.forEach((n) => (n.lopVo = lopVoTuCauHinh(n.cauHinhElectron, theoKyHieu)));
  demNguyenTo = tho.length;
  return tho;
}

export function soLuongNguyenToDaTai() {
  return demNguyenTo;
}

export async function layNguyenTheoKyHieu(kyHieu: string): Promise<NguyenTo | null> {
  const tatCa = await layTatCaNguyenTo();
  const k = kyHieu.toLowerCase();
  return tatCa.find((n) => n.kyHieu.toLowerCase() === k) ?? null;
}

/* ---------------------------------- HỢP CHẤT ----------------------------------- */

export interface HopChat {
  cid: number;
  tenTruyVan: string;
  congThuc: string | null;
  khoiLuongMol: number | null; // g/mol
  khoiLuongExact: number | null;
  iupac: string | null;
  smiles: string | null;
  xLogP: number | null;
  tpsa: number | null;
  hbd: number | null;
  hba: number | null;
  lienKetXoay: number | null;
  doPhucTap: number | null;
}

interface BangThuocTinh {
  PropertyTable: {
    Properties: {
      CID: number;
      MolecularFormula?: string;
      MolecularWeight?: string;
      ExactMass?: string;
      IUPACName?: string;
      ConnectivitySMILES?: string;
      SMILES?: string;
      XLogP?: number;
      TPSA?: number;
      HBondDonorCount?: number;
      HBondAcceptorCount?: number;
      RotatableBondCount?: number;
      Complexity?: number;
    }[];
  };
}

/**
 * Xác định đoạn đường dẫn PUG-REST cho một từ khóa tra cứu:
 *  - toàn số  → coi là CID thật (/compound/cid/{cid})
 *  - còn lại  → dịch alias tiếng Việt phổ biến (nếu có) rồi tra theo tên (/compound/name/{ten})
 */
function duongDanHopChat(tuKhoa: string): string {
  const t = tuKhoa.trim();
  if (/^\d+$/.test(t)) return `cid/${t}`;
  return `name/${encodeURIComponent(dichTenHopChat(t))}`;
}

/**
 * Thử lần lượt các biến thể tra cứu của một slug (xem `cacBienTheTraCuu` trong
 * dinh-danh-chat.ts) cho tới khi PubChem trả về dữ liệu — dừng ở biến thể đầu
 * tiên khớp. Dùng chung cho cả trang hợp chất và ảnh OG, tránh mỗi nơi tự thử
 * một biến thể khác nhau rồi lệch kết quả.
 */
export async function layHopChatTheoBienThe(
  cacBienThe: readonly string[],
): Promise<{ tuKhoaDung: string; hopChat: HopChat | null }> {
  for (const bt of cacBienThe) {
    const hopChat = await layHopChat(bt);
    if (hopChat) return { tuKhoaDung: bt, hopChat };
  }
  return { tuKhoaDung: cacBienThe[0], hopChat: null };
}

export async function layHopChat(ten: string): Promise<HopChat | null> {
  const duLieu = await goiPug<BangThuocTinh>(
    `/pug/compound/${duongDanHopChat(ten)}/property/MolecularFormula,MolecularWeight,ExactMass,IUPACName,ConnectivitySMILES,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`,
  );
  const p = duLieu?.PropertyTable?.Properties?.[0];
  if (!p) return null;
  return {
    cid: p.CID,
    tenTruyVan: ten,
    congThuc: p.MolecularFormula ?? null,
    khoiLuongMol: soHoacNull(p.MolecularWeight ?? ""),
    khoiLuongExact: soHoacNull(p.ExactMass ?? ""),
    iupac: p.IUPACName ?? null,
    smiles: p.ConnectivitySMILES ?? p.SMILES ?? null,
    xLogP: p.XLogP ?? null,
    tpsa: p.TPSA ?? null,
    hbd: p.HBondDonorCount ?? null,
    hba: p.HBondAcceptorCount ?? null,
    lienKetXoay: p.RotatableBondCount ?? null,
    doPhucTap: p.Complexity ?? null,
  };
}

/* ------------------------------ HỢP CHẤT 3 CHIỀU ------------------------------- */

export interface NguyenTu3D {
  so: number; // số hiệu nguyên tử
  x: number;
  y: number;
  z: number;
}

export interface LienKet3D {
  a: number; // chỉ số nguyên tử 1
  b: number; // chỉ số nguyên tử 2
  bac: number; // bậc liên kết 1/2/3
}

export interface HopChat3D {
  cid: number;
  tenTruyVan: string;
  congThuc: string | null;
  khoiLuongMol: number | null;
  nguyenTu: NguyenTu3D[];
  lienKet: LienKet3D[];
}

interface BanGhi3D {
  PC_Compounds: {
    id: { id: { cid: number } };
    atoms: { aid: number[]; element: number[] };
    bonds?: { aid1: number[]; aid2: number[]; order: number[] };
    coords?: { conformers?: { x: number[]; y: number[]; z: number[] }[] }[];
  }[];
}

export async function layHopChat3D(ten: string): Promise<HopChat3D | null> {
  const tenSach = ten.trim().slice(0, 120);
  const [banGhi, thuocTinh] = await Promise.all([
    goiPug<BanGhi3D>(`/pug/compound/${duongDanHopChat(tenSach)}/JSON?record_type=3d`),
    layHopChat(tenSach),
  ]);
  const pc = banGhi?.PC_Compounds?.[0];
  const conformer = pc?.coords?.[0]?.conformers?.[0];
  if (!pc || !conformer) return null;

  const { x = [], y = [], z = [] } = conformer;
  // Đưa phân tử về tâm khối hình học
  const n = pc.atoms.element.length;
  const tx = x.reduce((a, b) => a + b, 0) / n;
  const ty = y.reduce((a, b) => a + b, 0) / n;
  const tz = z.reduce((a, b) => a + b, 0) / n;

  const nguyenTu: NguyenTu3D[] = pc.atoms.element.map((so, i) => ({
    so,
    x: (x[i] - tx) * 0.62,
    y: (y[i] - ty) * 0.62,
    z: (z[i] - tz) * 0.62,
  }));

  const lienKet: LienKet3D[] = (pc.bonds?.aid1 ?? []).map((a1, i) => ({
    a: a1 - 1,
    b: (pc.bonds?.aid2 ?? [])[i] - 1,
    bac: (pc.bonds?.order ?? [])[i] || 1,
  }));

  return {
    cid: pc.id.id.cid,
    tenTruyVan: ten,
    congThuc: thuocTinh?.congThuc ?? null,
    khoiLuongMol: thuocTinh?.khoiLuongMol ?? null,
    nguyenTu,
    lienKet,
  };
}

/* ----------------------------------- GỢI Ý ------------------------------------- */

interface GoiYJson {
  dictionary_terms?: { compound?: string[] };
}

export async function layGoiY(tu: string): Promise<string[]> {
  const q = tu.trim().replace(/[/\\]/g, "").slice(0, 60);
  if (q.length < 2) return [];

  // Alias tiếng Việt phổ biến (nước, muối, đường…) — thêm dạng tiếng Anh thật lên đầu gợi ý.
  const goiYViet = goiYTenTiengViet(q);

  // CID thuần số: PubChem autocomplete không hiểu số, tra thẳng không cần gợi ý tên.
  if (/^\d+$/.test(q)) return [];

  const data = await goiPug<GoiYJson>(
    `/autocomplete/compound/${encodeURIComponent(dichTenHopChat(q))}/JSON?limit=8`,
  );
  const goiYPubChem = data?.dictionary_terms?.compound ?? [];
  return [...new Set([...goiYViet, ...goiYPubChem])].slice(0, 8);
}
