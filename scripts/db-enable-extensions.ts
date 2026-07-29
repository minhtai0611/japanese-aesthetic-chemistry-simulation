/**
 * Bật 2 extension Postgres cần cho tìm kiếm tiếng Việt không dấu + chịu sai
 * chính tả: `unaccent` (bỏ dấu ngay trong SQL, không cần chuẩn hoá ở app) và
 * `pg_trgm` (fuzzy match theo trigram, dùng cho GIN index trong schema.ts).
 *
 * Idempotent — chạy lại vô hại (CREATE EXTENSION IF NOT EXISTS). Chạy MỘT
 * LẦN trước `npm run db:push` trên một Postgres mới, vì db:push (drizzle-kit)
 * không tự quản lý extension.
 *
 * Dùng: npx tsx scripts/db-enable-extensions.ts
 */
import "dotenv/config";
import { pool } from "../src/db";

async function main() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS unaccent");
  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");

  // unaccent() của Postgres được đánh dấu STABLE (không IMMUTABLE) vì về lý
  // thuyết phụ thuộc cấu hình dictionary — nên KHÔNG dùng trực tiếp được
  // trong index biểu thức ("functions in index expression must be marked
  // IMMUTABLE"). Bọc lại bằng hàm SQL cố định dictionary 'unaccent' — với
  // dictionary cố định, kết quả chuyển đổi ký tự thực sự tất định, an toàn
  // để khai IMMUTABLE. Đây là cách khắc phục chuẩn, được khuyến nghị chính
  // thức trong tài liệu Postgres cho tình huống này.
  // LANGUAGE plpgsql (không phải sql): hàm sql đơn giản bị Postgres "inline"
  // thẳng vào biểu thức index lúc CREATE INDEX, và bước inline đó lại tự đi
  // phân giải lại tên dictionary/overload — gây đúng lỗi "does not exist" dù
  // gọi hàm trực tiếp (ngoài index) chạy bình thường. plpgsql không bị inline
  // nên IMMUTABLE được chấp nhận tại mặt chữ, không cần Postgres verify lại.
  await pool.query(`
    CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text AS $$
    BEGIN
      RETURN unaccent('unaccent', $1);
    END;
    $$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
  `);

  const { rows } = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm') ORDER BY 1",
  );
  console.log("Extension đã bật:", rows.map((r) => r.extname).join(", "));
  console.log("Hàm f_unaccent(text) đã tạo (IMMUTABLE wrapper cho unaccent()).");
  await pool.end();
}

main();
