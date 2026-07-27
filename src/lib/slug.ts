import { slugCanonical, cacBienTheTraCuu } from "./dinh-danh-chat";

/** Slug hóa tên hợp chất cho route /hop-chat/[ten] — permalink chia sẻ được, LUÔN ASCII-safe */
export function slugHoaHopChat(ten: string): string {
  return slugCanonical(ten);
}

/**
 * Giải slug thành MỘT từ khoá tra cứu đáng thử nhất (biến thể nguyên văn).
 * Nơi cần thử hết mọi biến thể (alias tiếng Việt, dấu cách…) — như trang
 * hợp chất chính và ảnh OG — dùng thẳng `cacBienTheTraCuu` + `layHopChatTheoBienThe`.
 */
export function boSlugHopChat(slug: string): string {
  return cacBienTheTraCuu(slug)[0];
}
