/**
 * TẦNG ĐỊNH DANH CHẤT (Compound Identity Layer)
 *
 * Gộp lời giải cho các lỗi cùng một gốc: không có tầng nào chịu trách nhiệm
 * biến "thứ người dùng gõ" thành "định danh chuẩn của một chất".
 *
 *   - URL chứa ký tự tiếng Việt (> U+00FF) làm sập render Page ở dynamic
 *     segment (14/39 alias tiếng Việt trong sản xuất — xác nhận bằng đo thật,
 *     KHÔNG phải suy đoán: cùng chuỗi encode gọi API route hay OG-image route
 *     đều 200, chỉ riêng Page mới 500).
 *   - Slug tuỳ ý mở ra toàn bộ CSDL PubChem hơn trăm triệu chất — sản phẩm
 *     giáo dục cấp 3 vô tình phục vụ cả LSD/MDA qua tên lóng tiếng Anh.
 *
 * Nguyên tắc:
 *   1. URL canonical LUÔN là ASCII. Biến thể có dấu/khoảng trắng thừa → 308.
 *   2. Chỉ chất trong whitelist giáo dục mới được index (chất khác vẫn xem
 *      được — không chặn tri thức — nhưng gắn banner + noindex).
 *
 * KHÔNG dùng AI. Chuẩn hoá bằng NFD + strip diacritics (Unicode chuẩn), tra
 * bảng tất định.
 */
import { ALIAS_HOP_CHAT } from "./alias-hop-chat";
import { HOP_CHAT_NOI_BAT } from "./hop-chat-noi-bat";

/** Bỏ dấu tiếng Việt, giữ nguyên gạch nối (có nghĩa trong danh pháp IUPAC) */
export function boDauTiengViet(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Slug canonical: LUÔN ASCII-safe, an toàn cho dynamic route segment */
export function slugCanonical(ten: string): string {
  const s = boDauTiengViet(ten.trim().toLowerCase())
    .replace(/[^a-z0-9,\-\s.]/g, "") // giữ dấu phẩy/gạch nối/chấm — có nghĩa hoá học
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "khong-xac-dinh";
}

const ALIAS_CHUAN = new Map(Object.entries(ALIAS_HOP_CHAT).map(([vi, en]) => [slugCanonical(vi), en]));

/** Tra alias theo slug đã chuẩn hoá — 'nuoc', 'nước', 'NƯỚC' đều khớp */
export function traAlias(tuKhoa: string): string | null {
  return ALIAS_CHUAN.get(slugCanonical(tuKhoa)) ?? null;
}

/**
 * Khôi phục các biến thể từ khoá tra cứu từ một slug đã canonical.
 *
 * QUAN TRỌNG: KHÔNG được biến gạch nối thành dấu cách một cách mù quáng —
 * PubChem phân biệt '1,3,7-trimethylxanthine' (200) với '1,3,7 trimethylxanthine'
 * (404). Chiến lược: thử nguyên văn trước, rồi alias tiếng Việt, và chỉ khi cả
 * hai thất bại mới thử biến thể dấu cách.
 */
export function cacBienTheTraCuu(slug: string): string[] {
  const raw = decodeURIComponent(slug).trim();
  const bienThe = new Set<string>();
  bienThe.add(raw); // 1. nguyên văn (giữ gạch nối)
  const aliasHit = traAlias(raw);
  if (aliasHit) bienThe.add(aliasHit); // 2. alias tiếng Việt → tên PubChem
  bienThe.add(raw.replace(/-/g, " ")); // 3. cuối cùng mới thử dấu cách
  return [...bienThe];
}

/** URL slug có cần redirect 308 về canonical không? Trả null nếu đã canonical. */
export function canRedirect(slug: string): string | null {
  const raw = decodeURIComponent(slug);
  const canon = slugCanonical(raw);
  return canon !== raw ? canon : null;
}

/* --------------------------- WHITELIST GIÁO DỤC --------------------------- */

/**
 * Chất được phép prerender + index. Ngoài danh sách này vẫn xem được (không
 * chặn tri thức) nhưng gắn noindex + banner "ngoài chương trình phổ thông".
 *
 * Lý do: /hop-chat/love trả về MDA, /hop-chat/sunshine trả về LSD trong một
 * sản phẩm giáo dục cho học sinh cấp 3 — không định quảng bá thứ này.
 *
 * Suy ra TRỰC TIẾP từ hai danh mục đã có sẵn trong repo (không bịa thêm entry
 * ngoài dữ liệu thật): HOP_CHAT_NOI_BAT (chất nổi bật, có 3D) và ALIAS_HOP_CHAT
 * (39 khoá tiếng Việt tác giả đã tuyển). Đây chính là "danh mục giáo dục" thật
 * của sản phẩm, không phải danh sách tay mới tự đặt ra.
 */
interface ChatGiaoDuc {
  slug: string;
  ten: string;
}

const theoSlug = new Map<string, ChatGiaoDuc>();
for (const { ten } of HOP_CHAT_NOI_BAT) theoSlug.set(slugCanonical(ten), { slug: slugCanonical(ten), ten });
for (const [vi, en] of Object.entries(ALIAS_HOP_CHAT)) {
  const slug = slugCanonical(vi);
  if (!theoSlug.has(slug)) theoSlug.set(slug, { slug, ten: en });
}

export const CHAT_GIAO_DUC: readonly ChatGiaoDuc[] = [...theoSlug.values()];

const SLUG_GIAO_DUC = new Set(CHAT_GIAO_DUC.map((c) => c.slug));

/** Chất này (theo slug/tên) có thuộc whitelist giáo dục không? */
export const laChatGiaoDuc = (tenHoacSlug: string): boolean => SLUG_GIAO_DUC.has(slugCanonical(tenHoacSlug));
