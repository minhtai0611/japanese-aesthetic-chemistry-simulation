/**
 * Sổ tay thí nghiệm — lưu/đọc lại tham số + kết quả một lượt mô phỏng, theo
 * client_id ẩn danh (không đăng nhập). Đây là ghi DB thật đầu tiên do người
 * dùng chủ động kích hoạt trong toàn bộ ứng dụng (khác các bảng cache/log ở
 * src/db/schema.ts vốn chỉ ghi từ phía server).
 */
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { soTayThiNghiem } from "@/db/schema";
import type { SlugPhong } from "@/lib/phong-thi-nghiem";

export interface DauVaoSoTay {
  loaiPhong: SlugPhong;
  tieuDe: string;
  thamSo: Record<string, unknown>;
  ketQua: Record<string, unknown>;
  ghiChu?: string;
}

export async function luuSoTay(clientId: string, dauVao: DauVaoSoTay) {
  const [dong] = await db
    .insert(soTayThiNghiem)
    .values({
      clientId,
      loaiPhong: dauVao.loaiPhong,
      tieuDe: dauVao.tieuDe,
      thamSo: dauVao.thamSo,
      ketQua: dauVao.ketQua,
      ghiChu: dauVao.ghiChu,
    })
    .returning();
  return dong;
}

export async function laySoTayCuaToi(clientId: string) {
  return db
    .select()
    .from(soTayThiNghiem)
    .where(eq(soTayThiNghiem.clientId, clientId))
    .orderBy(desc(soTayThiNghiem.taoLuc));
}

/** Kiểm tra quyền sở hữu bằng clientId — không cho xem/in báo cáo của người khác. */
export async function laySoTayTheoId(id: number, clientId: string) {
  const [dong] = await db
    .select()
    .from(soTayThiNghiem)
    .where(and(eq(soTayThiNghiem.id, id), eq(soTayThiNghiem.clientId, clientId)));
  return dong ?? null;
}
