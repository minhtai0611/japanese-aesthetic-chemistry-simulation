/**
 * Tìm hợp chất theo tên tiếng Việt/Anh, KHÔNG phân biệt dấu và chịu được sai
 * chính tả — thuần SQL (to_tsvector cho khớp từ, pg_trgm similarity cho
 * fuzzy). KHÔNG dùng AI/embedding — đây là yêu cầu bắt buộc của dự án.
 *
 * DB-trước/PubChem-sau: đây là lớp NHANH, không phụ thuộc giới hạn tần suất
 * PubChem. Nếu DB lỗi hoặc không có kết quả, caller (route /api/goi-y) tự
 * rơi về layGoiY (PubChem autocomplete) — xem docs/tim-kiem.md.
 */
import { db } from "@/db";
import { searchLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export type KetQuaTimKiem = Record<string, unknown> & {
  cid: number;
  tenTruyVan: string;
  congThuc: string | null;
  khoiLuongMol: number | null;
  alias: string;
  diem: number;
};

export async function timHopChat(q: string, limit = 8): Promise<KetQuaTimKiem[]> {
  const tu = q.trim();
  if (tu.length < 2) return [];

  const { rows } = await db.execute<KetQuaTimKiem>(sql`
    SELECT c.cid, c.ten_truy_van AS "tenTruyVan", c.cong_thuc AS "congThuc",
           c.khoi_luong_mol AS "khoiLuongMol", a.alias,
           GREATEST(
             ts_rank(to_tsvector('simple', f_unaccent(a.alias)),
                     plainto_tsquery('simple', f_unaccent(${tu}))),
             similarity(f_unaccent(lower(a.alias)), f_unaccent(lower(${tu})))
           ) AS diem
    FROM compound_aliases a
    JOIN compound_cache c ON c.cid = a.cid
    WHERE to_tsvector('simple', f_unaccent(a.alias)) @@ plainto_tsquery('simple', f_unaccent(${tu}))
       OR similarity(f_unaccent(lower(a.alias)), f_unaccent(lower(${tu}))) > 0.3
    ORDER BY diem DESC
    LIMIT ${limit}
  `);

  // Ghi nhật ký truy vấn — nguồn để mở rộng alias theo HÀNH VI THẬT của người
  // dùng, thay vì đoán. KHÔNG await: đây là side effect, không phải một phần
  // của kết quả tìm kiếm — chờ nó chỉ tốn thêm một round-trip DB cho người
  // dùng mà không mang lại giá trị gì cho họ. Lỗi ghi log KHÔNG được làm
  // hỏng/làm chậm kết quả tìm kiếm.
  db.insert(searchLogs)
    .values({ tuKhoa: tu, coKetQua: rows.length > 0 ? 1 : 0 })
    .catch((e) => console.error("[tim-kiem] ghi search_logs lỗi:", e instanceof Error ? e.message : e));

  return rows;
}

export type KetQuaCauTruc = {
  cid: number;
  tenTruyVan: string;
  congThuc: string | null;
  khoiLuongMol: number | null;
  smiles: string | null;
  iupac: string | null;
  inchikey: string | null;
};

/**
 * Tìm hợp chất theo cấu trúc: chuỗi con SMILES/IUPAC/InChIKey (ILIKE, dùng
 * chỉ mục trigram GIN trên compound_cache) và/hoặc dải khối lượng mol. Chỉ
 * tìm trong compound_cache — những chất ĐÃ đồng bộ thật từ PubChem qua
 * dong-bo-hop-chat.ts, không suy đoán/nội suy khối lượng cho chất chưa có.
 * Không có tham số nào → trả rỗng (tránh SELECT * vô điều kiện).
 */
export async function timCauTrucHoaHoc(params: {
  tuKhoa?: string;
  khoiLuongToiThieu?: number;
  khoiLuongToiDa?: number;
  limit?: number;
}): Promise<KetQuaCauTruc[]> {
  const { tuKhoa, khoiLuongToiThieu, khoiLuongToiDa, limit = 20 } = params;
  const tu = tuKhoa?.trim();

  const dieuKien = [];
  if (tu) {
    const mau = `%${tu}%`;
    dieuKien.push(sql`(c.smiles ILIKE ${mau} OR c.iupac ILIKE ${mau} OR c.inchikey ILIKE ${mau})`);
  }
  if (khoiLuongToiThieu != null) dieuKien.push(sql`c.khoi_luong_mol >= ${khoiLuongToiThieu}`);
  if (khoiLuongToiDa != null) dieuKien.push(sql`c.khoi_luong_mol <= ${khoiLuongToiDa}`);
  if (dieuKien.length === 0) return [];

  const { rows } = await db.execute<KetQuaCauTruc>(sql`
    SELECT c.cid, c.ten_truy_van AS "tenTruyVan", c.cong_thuc AS "congThuc",
           c.khoi_luong_mol AS "khoiLuongMol", c.smiles, c.iupac, c.inchikey
    FROM compound_cache c
    WHERE ${sql.join(dieuKien, sql` AND `)}
    ORDER BY c.khoi_luong_mol ASC NULLS LAST
    LIMIT ${limit}
  `);
  return rows;
}
