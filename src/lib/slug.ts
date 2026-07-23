/** Slug hóa/giải slug tên hợp chất cho route /hop-chat/[ten] — permalink chia sẻ được */
export function slugHoaHopChat(ten: string): string {
  return encodeURIComponent(ten.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function boSlugHopChat(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}
