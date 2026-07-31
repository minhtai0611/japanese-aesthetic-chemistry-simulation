/**
 * Nhiệt động lực học phản ứng: ΔH°rxn (+ ΔG°rxn khi đủ dữ liệu) qua định
 * luật Hess, áp dụng lên hệ số ĐÃ CÂN BẰNG từ can-bang.ts (gọi riêng, không
 * gộp vào canBang() — canBang() phải giữ nguyên đồng bộ cho 50 test hiện có
 * và mọi nơi đang dùng nó; tra nhiệt động cần gọi mạng nên bắt buộc bất
 * đồng bộ).
 *
 * BA NGUỒN, MỖI NGUỒN MỘT VAI TRÒ RIÊNG — KHÔNG trộn số liệu khác bản chất
 * vào cùng một phép cộng:
 *
 *  1. BẢNG GHIM (NIST Chemistry WebBook + CODATA Key Values for
 *     Thermodynamics, Cox/Wagman/Medvedev 1989) — nguyên tố ở trạng thái
 *     chuẩn (ΔH°f = ΔG°f = 0 theo định nghĩa IUPAC, không phải số đo) và vài
 *     hợp chất được trích dẫn thống nhất giữa các nguồn, đã xác minh thủ
 *     công. Nguồn ĐÁNG TIN CẬY NHẤT — luôn được ưu tiên khi có.
 *
 *  2. PubChem (`layHopChat`, đã có sẵn trong dự án) — KHÔNG cung cấp số
 *     liệu nhiệt động (PUG-REST/PUG-View không có heading tin cậy, xác nhận
 *     ở Giai Đoạn 2). Vai trò ở đây CHỈ để: (a) xác nhận công thức là một
 *     chất thật sự tồn tại trước khi tra Materials Project (chặn công thức
 *     vô nghĩa), (b) lấy CID làm liên kết nguồn gốc hiển thị cho người dùng
 *     tự kiểm chứng trên PubChem — KHÔNG phải nguồn số liệu nhiệt động.
 *
 *  3. Materials Project API (materialsproject.org, cần
 *     MATERIALS_PROJECT_API_KEY) — formation_energy_per_atom tính bằng DFT
 *     ở ~0K, KHÁC BẢN CHẤT với ΔH°f thực nghiệm ở 298,15K. Đã đối chiếu thủ
 *     công: khớp rất gần với Fe2O3 (~-823 so với -824,2 kJ/mol) nhưng lệch
 *     ~6% với Ca(OH)2 — không đồng nhất, KHÔNG thể coi là tương đương ΔH°f
 *     thực nghiệm. Chỉ dùng khi bảng ghim không có, luôn đánh dấu rõ nguồn
 *     "DFT" trong kết quả, KHÔNG bao giờ hiển thị như một số ΔH°f thực
 *     nghiệm, và KHÔNG tham gia tính ΔG°rxn (xem dưới).
 *
 * ĐÃ THỬ VÀ BỎ Wikidata (property P3078 ΔH°f / P3071 entropy chuẩn): phát
 * hiện 2 LỖI SỐ LIỆU THẬT khi đối chiếu tay trên chính những chất cơ bản
 * nhất — CO2 (Q1997) có P3078 = +394 kJ/mol (đúng phải là -393,5, SAI DẤU)
 * và graphit (Q5309) có P3071 = 55,74 J/(mol·K) (đúng phải là ~5,7, sai một
 * bậc độ lớn). Không có cách nào lọc lỗi tương tự cho các chất KHÔNG có
 * trong bảng ghim để đối chiếu — nếu ngay cả CO2/graphit còn sai, các chất
 * ít phổ biến hơn rủi ro cao hơn, không thấp hơn. Quyết định KHÔNG dùng
 * Wikidata làm nguồn số liệu nhiệt động trong dự án này.
 *
 * ΔG°rxn CHỈ tính được khi TẤT CẢ chất trong phản ứng đều có trong bảng ghim
 * — đây là nguồn duy nhất có ΔG°f thật đã xác minh. KHÔNG suy ra ΔG từ
 * entropy tuyệt đối (tránh rủi ro ghép sai pha/đơn vị/nguồn không đồng
 * nhất), KHÔNG dùng giá trị DFT của Materials Project cho ΔG°rxn.
 */
import { layHopChat } from "@/lib/pubchem";
import { phanTichCongThuc } from "./parser-cong-thuc";

export interface DuLieuGhim {
  /** ΔH°f — entanpi tạo thành chuẩn, kJ/mol, 298,15 K */
  deltaH: number;
  /** ΔG°f — năng lượng Gibbs tạo thành chuẩn, kJ/mol, 298,15 K */
  deltaG: number;
}

/** Nguồn: NIST Chemistry WebBook + CODATA Key Values for Thermodynamics (xem chú thích đầu file). */
const BANG_GHIM: Record<string, DuLieuGhim> = {
  // Nguyên tố ở trạng thái chuẩn — định nghĩa IUPAC, không phải số đo.
  H2: { deltaH: 0, deltaG: 0 },
  O2: { deltaH: 0, deltaG: 0 },
  N2: { deltaH: 0, deltaG: 0 },
  Fe: { deltaH: 0, deltaG: 0 },
  C: { deltaH: 0, deltaG: 0 }, // graphit — dạng chuẩn của carbon
  // Hợp chất — số đo thật, đã xác minh thủ công (xem chú thích đầu file).
  H2O: { deltaH: -285.8, deltaG: -237.1 }, // lỏng
  CO2: { deltaH: -393.5, deltaG: -394.4 }, // khí
  NH3: { deltaH: -46.1, deltaG: -16.5 }, // khí
  Fe2O3: { deltaH: -824.2, deltaG: -742.2 }, // rắn (hematit)
};

/** Chữ ký thành phần nguyên tố — khoá tra bảng, không phụ thuộc thứ tự nguyên tố trong công thức. */
function chuKyNguyenTo(bang: Record<string, number>): string {
  return Object.entries(bang)
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nt, n]) => `${nt}${n}`)
    .join("");
}

const GHIM_THEO_CHU_KY: Map<string, DuLieuGhim> = new Map(
  Object.entries(BANG_GHIM).map(([congThuc, d]) => [chuKyNguyenTo(phanTichCongThuc(congThuc)), d]),
);

const EV_SANG_KJ_MOL = 96.485;

/**
 * DFT formation energy (eV/nguyên tử) từ Materials Project → kJ/mol MỖI
 * CÔNG THỨC (không phải mỗi nguyên tử) — nhân theo số nguyên tử thật trong
 * một đơn vị công thức. null nếu không tìm được chất ổn định khớp công
 * thức, thiếu API key, hoặc lỗi mạng (KHÔNG được làm hỏng luồng cân bằng).
 */
async function layTuMaterialsProject(chuKyCongThuc: string, soNguyenTu: number): Promise<number | null> {
  const key = process.env.MATERIALS_PROJECT_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.materialsproject.org/materials/summary/?formula=${encodeURIComponent(chuKyCongThuc)}&is_stable=true&_fields=formation_energy_per_atom`;
    const res = await fetch(url, { headers: { "X-API-KEY": key } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { formation_energy_per_atom?: number }[] };
    const eVMoiNguyenTu = json.data?.[0]?.formation_energy_per_atom;
    return eVMoiNguyenTu == null ? null : eVMoiNguyenTu * soNguyenTu * EV_SANG_KJ_MOL;
  } catch (e) {
    console.error("[nhiet-dong] Materials Project lỗi:", e instanceof Error ? e.message : e);
    return null;
  }
}

export interface KetQuaMotChat {
  deltaH: number;
  /** null khi chất chỉ có nguồn DFT — Materials Project không cung cấp ΔG°f thực nghiệm tương đương. */
  deltaG: number | null;
  nguon: "ghim" | "materials-project-dft";
  /** CID PubChem để hiển thị liên kết nguồn gốc — KHÔNG phải nguồn số liệu nhiệt động. */
  cid: number | null;
}

/**
 * Tra dữ liệu nhiệt động cho MỘT chất. Thứ tự ưu tiên: bảng ghim (đã xác
 * minh) → Materials Project (DFT, chỉ khi PubChem xác nhận đây là một chất
 * thật) → null (không có dữ liệu ở bất kỳ nguồn nào, KHÔNG suy đoán).
 */
export async function layDuLieuMotChat(
  congThuc: string,
  bangNguyenTu: Record<string, number>,
): Promise<KetQuaMotChat | null> {
  const chuKy = chuKyNguyenTo(bangNguyenTu);
  const ghim = GHIM_THEO_CHU_KY.get(chuKy);
  if (ghim) return { deltaH: ghim.deltaH, deltaG: ghim.deltaG, nguon: "ghim", cid: null };

  let cid: number | null = null;
  try {
    const hopChat = await layHopChat(congThuc);
    cid = hopChat?.cid ?? null;
  } catch {
    cid = null;
  }
  if (cid == null) return null; // PubChem không nhận ra đây là một chất thật — không tra Materials Project

  const soNguyenTu = Object.values(bangNguyenTu).reduce((a, b) => a + b, 0);
  const deltaHDft = await layTuMaterialsProject(chuKy, soNguyenTu);
  if (deltaHDft == null) return null;

  return { deltaH: deltaHDft, deltaG: null, nguon: "materials-project-dft", cid };
}

export type KetQuaNhietDong =
  | {
      coDuLieu: true;
      deltaH: number;
      /** null nếu có bất kỳ chất nào không thuộc bảng ghim (nguồn DFT không tham gia ΔG°rxn). */
      deltaG: number | null;
      /** true nếu ΔH°rxn có dùng ít nhất một giá trị DFT (Materials Project) — cần hiển thị rõ trong UI. */
      coNguonDFT: boolean;
      chiTietNguon: { ten: string; nguon: "ghim" | "materials-project-dft"; cid: number | null }[];
    }
  | { coDuLieu: false; thieuChat: string[] };

/**
 * Định luật Hess: ΔH°rxn = Σ(nᵢ·ΔH°f,sản phẩm) − Σ(mⱼ·ΔH°f,chất phản ứng),
 * tính được từ TỔ HỢP bất kỳ nguồn (ghim + DFT, vì ΔH°f là ΔH°f bất kể
 * nguồn). ΔG°rxn tính tương tự nhưng CHỈ khi MỌI chất đều từ bảng ghim.
 * Thiếu dữ liệu của BẤT KỲ chất nào (ở CẢ HAI phép tính) → không tính,
 * trả về danh sách chất thiếu.
 */
export async function tinhNhietDongPhanUng(
  tenTrai: string[],
  bangTrai: Record<string, number>[],
  heSoTrai: number[],
  tenPhai: string[],
  bangPhai: Record<string, number>[],
  heSoPhai: number[],
): Promise<KetQuaNhietDong> {
  const [ketQuaTrai, ketQuaPhai] = await Promise.all([
    Promise.all(bangTrai.map((b, i) => layDuLieuMotChat(tenTrai[i], b))),
    Promise.all(bangPhai.map((b, i) => layDuLieuMotChat(tenPhai[i], b))),
  ]);

  const thieu: string[] = [];
  ketQuaTrai.forEach((k, i) => {
    if (!k) thieu.push(tenTrai[i]);
  });
  ketQuaPhai.forEach((k, i) => {
    if (!k) thieu.push(tenPhai[i]);
  });
  if (thieu.length > 0) return { coDuLieu: false, thieuChat: [...new Set(thieu)] };

  let deltaH = 0;
  let deltaG: number | null = 0;
  let coNguonDFT = false;
  const chiTietNguon: { ten: string; nguon: "ghim" | "materials-project-dft"; cid: number | null }[] = [];

  ketQuaPhai.forEach((k, i) => {
    const d = k!;
    deltaH += heSoPhai[i] * d.deltaH;
    if (d.deltaG == null) deltaG = null;
    else if (deltaG != null) deltaG += heSoPhai[i] * d.deltaG;
    if (d.nguon === "materials-project-dft") coNguonDFT = true;
    chiTietNguon.push({ ten: tenPhai[i], nguon: d.nguon, cid: d.cid });
  });
  ketQuaTrai.forEach((k, i) => {
    const d = k!;
    deltaH -= heSoTrai[i] * d.deltaH;
    if (d.deltaG == null) deltaG = null;
    else if (deltaG != null) deltaG -= heSoTrai[i] * d.deltaG;
    if (d.nguon === "materials-project-dft") coNguonDFT = true;
    chiTietNguon.push({ ten: tenTrai[i], nguon: d.nguon, cid: d.cid });
  });

  return { coDuLieu: true, deltaH, deltaG, coNguonDFT, chiTietNguon };
}
