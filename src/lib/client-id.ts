/**
 * Định danh ẩn danh cho sổ tay thí nghiệm & nộp bài — một cookie UUID, KHÔNG
 * cần đăng nhập. Chỉ dùng trong Route Handler/Server Action (nơi cookies()
 * cho ghi được); Server Component chỉ đọc được, dùng docClientId().
 */
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const TEN_COOKIE = "kagaku_client_id";
const HAI_NAM = 60 * 60 * 24 * 365 * 2;

/** Đọc client_id hiện có, hoặc tạo mới + ghi cookie nếu chưa từng có. */
export async function layHoacTaoClientId(): Promise<string> {
  const jar = await cookies();
  const hienCo = jar.get(TEN_COOKIE)?.value;
  if (hienCo) return hienCo;

  const moi = randomUUID();
  jar.set(TEN_COOKIE, moi, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: HAI_NAM,
    path: "/",
  });
  return moi;
}

/** Chỉ đọc — dùng ở nơi không được phép ghi cookie (Server Component). */
export async function docClientId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TEN_COOKIE)?.value ?? null;
}
