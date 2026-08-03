/**
 * Token-bucket phân tán trên Postgres cho giới hạn gọi PubChem PUG-REST —
 * thay semaphore trong-process cũ (dangChay/HANG_DOI/TRAN, đã xoá khỏi
 * pubchem.ts), vốn không điều phối được giữa các Vercel serverless instance
 * khác nhau — mỗi instance có bộ đếm trong-process riêng, nên tổng tốc độ
 * gọi thực tế có thể vượt xa <=5 req/s dù mỗi instance tự giới hạn 4 lượt
 * đồng thời.
 *
 * Nạp lại + tiêu token trong MỘT câu lệnh SQL nguyên tử duy nhất
 * (INSERT ... ON CONFLICT DO UPDATE ... WHERE) — an toàn dưới tải đồng thời
 * nhờ Postgres tự khoá dòng: caller thứ hai chờ caller thứ nhất commit rồi
 * mới đánh giá lại trên dòng đã cập nhật, không có khoảng hở đọc-rồi-ghi.
 * Nếu điều kiện WHERE sai (không đủ token), UPDATE bị bỏ qua và câu lệnh
 * ảnh hưởng 0 dòng — đây là hành vi UPSERT chuẩn, có tài liệu của Postgres,
 * không phải suy đoán.
 *
 * Import `@/db` ĐỘNG (không tĩnh ở đầu file) — cùng lý do pubchem.ts đã dùng
 * `await import("@/db")` cho layConformerTuCache: tránh buộc MỌI nơi import
 * module này (kể cả test thuần không chạm DB) phải có DATABASE_URL sẵn, vì
 * `src/db/index.ts` ném lỗi ngay khi load module nếu thiếu biến đó.
 */
const KHOA_PUBCHEM = "pubchem_pug_rest";
const SUC_CHUA = 4; // tokens tối đa (capacity) — cùng biên an toàn TRAN=4 cũ
const TOC_DO_NAP = 4; // tokens/giây (refill) — dưới ngưỡng <=5 req/s thật của NCBI
const KHOANG_CHO_MS = 260; // ~1000/TOC_DO_NAP
/**
 * Hạn chờ theo THỜI GIAN THỰC, không phải số lần thử cố định — `next build`
 * chạy generateStaticParams cho ~150 trang gần như đồng thời (nhiều worker
 * song song), tạo một đợt burst thật sự vượt xa 4 token/giây ngay lúc khởi
 * động. Một hạn cố định vài giây (thử ban đầu) khiến hầu hết các trang build
 * tĩnh bỏ cuộc và in lỗi hàng loạt — bắt được thật qua `npm run build`, không
 * phải giả định. 60 giây đủ để token bucket rưới đủ cho một đợt burst lớn
 * (60s × 4 token/s = 240 token) mà vẫn có một hạn chót, không chờ vô tận nếu
 * DB thật sự có vấn đề.
 */
const HAN_CHO_MS = 60_000;

async function thuLayToken(khoa: string, sucChua: number, tocDoNap: number): Promise<boolean> {
  const { pool } = await import("@/db");
  const ketQua = await pool.query(
    `INSERT INTO api_token_bucket (key, tokens, last_refreshed)
     VALUES ($1, $2 - 1, now())
     ON CONFLICT (key) DO UPDATE SET
       tokens = LEAST($2, api_token_bucket.tokens
         + EXTRACT(EPOCH FROM (now() - api_token_bucket.last_refreshed)) * $3) - 1,
       last_refreshed = now()
     WHERE LEAST($2, api_token_bucket.tokens
         + EXTRACT(EPOCH FROM (now() - api_token_bucket.last_refreshed)) * $3) >= 1`,
    [khoa, sucChua, tocDoNap],
  );
  return (ketQua.rowCount ?? 0) > 0;
}

/**
 * Xin một lượt gọi PubChem qua token-bucket phân tán. Trả về khi có token;
 * ném lỗi nếu chờ quá `HAN_CHO_MS` — caller (goiPugAnToan trong pubchem.ts)
 * đã có sẵn vòng lặp bắt lỗi/backoff/bỏ cuộc cho mỗi lượt thử mạng, không
 * cần thêm cơ chế xử lý lỗi riêng ở đây.
 */
export async function xinLuotPubChem(): Promise<void> {
  const hetHan = Date.now() + HAN_CHO_MS;
  while (Date.now() < hetHan) {
    if (await thuLayToken(KHOA_PUBCHEM, SUC_CHUA, TOC_DO_NAP)) return;
    await new Promise((r) => setTimeout(r, KHOANG_CHO_MS));
  }
  throw new Error("rate limiter: hết lượt chờ token PubChem");
}
