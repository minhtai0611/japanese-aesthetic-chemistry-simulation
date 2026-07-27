# Kiến trúc tìm kiếm hợp chất/nguyên tố

## Đang hoạt động (không cần DB)

- **Alias tiếng Việt** (`src/lib/alias-hop-chat.ts`): các tên gọi phổ biến (nước, muối,
  đường, cồn, giấm, xút, thuốc tím, baking soda, axit sunfuric…) được dịch sang tên
  PubChem thật trước khi tra cứu (`layHopChat`, `layHopChat3D`) và trước khi gọi
  autocomplete (`layGoiY`). Đây là bảng dịch tên, **không phải** dữ liệu hóa học.
- **Tra theo CID**: nếu từ khóa toàn số, hệ thống tra thẳng
  `/compound/cid/{cid}` thay vì `/compound/name/{ten}` — gõ CID PubChem (ví dụ
  `2519` cho caffeine) ra đúng kết quả.
- Gợi ý (`/api/goi-y`) gộp cả alias tiếng Việt khớp tiền tố lẫn autocomplete gốc của
  PubChem, khử trùng lặp.

## Đã nối dây (Postgres thật, kể từ PHA 4)

Schema trong `src/db/schema.ts` định nghĩa 5 bảng cho lớp tìm kiếm/cache nội bộ:

| Bảng | Vai trò |
|---|---|
| `compound_cache` | Cache thuộc tính hợp chất đã tra (+ `co_3d`, `da_xac_thuc`, `la_giao_duc`) |
| `compound_aliases` | Alias hợp chất tiếng Việt/Anh, 3 chỉ mục GIN: `to_tsvector` thô, `to_tsvector(f_unaccent(...))` không dấu, `pg_trgm` fuzzy |
| `featured_compounds` | Danh sách hợp chất có permalink — **chưa dùng tới**, `HOP_CHAT_NOI_BAT` tĩnh vẫn là nguồn thật |
| `element_aliases` | Alias nguyên tố tiếng Việt — **chưa seed**, ngoài phạm vi PHA 4 |
| `search_logs` | Nhật ký truy vấn không ra kết quả — xem `/quan-tri/tu-khoa-thieu` |

### Bộ nhớ dịch (unaccent) cần một hàm bọc IMMUTABLE

`unaccent()` gốc của Postgres được đánh dấu **STABLE**, không **IMMUTABLE** — không
dùng trực tiếp được trong index biểu thức. `scripts/db-enable-extensions.ts` tạo
hàm bọc `f_unaccent(text)` bằng `LANGUAGE plpgsql IMMUTABLE` (plpgsql, không phải
sql thuần — hàm sql đơn giản bị Postgres "inline" vào lúc `CREATE INDEX`, gây lỗi
phân giải dictionary/overload không nhất quán; plpgsql tránh được việc đó). Phải
chạy script này **trước** `npm run db:push` trên một Postgres mới.

### Cách kích hoạt trên một Postgres mới

```bash
# 1. Trỏ DATABASE_URL tới Postgres thật (Neon hoặc tương đương)
npx tsx scripts/db-enable-extensions.ts   # bật unaccent + pg_trgm, tạo f_unaccent()
npm run db:push                           # áp schema
npx tsx scripts/seed-compounds.ts         # seed compound_cache + compound_aliases
                                           # từ HOP_CHAT_NOI_BAT + ALIAS_HOP_CHAT thật
```

### Luồng tra cứu thật (src/lib/tim-kiem.ts, /api/goi-y)

1. `timHopChat()` tìm trong `compound_aliases`/`compound_cache` bằng
   `to_tsvector('simple', f_unaccent(alias)) @@ plainto_tsquery(...)` OR
   `similarity(f_unaccent(lower(alias)), ...) > 0.3` (fuzzy sai chính tả nhẹ).
2. `/api/goi-y` gọi bước 1 trước; DB lỗi (mất kết nối, `DATABASE_URL` sai…) hoặc
   không ra kết quả → rơi về `layGoiY` (PubChem autocomplete) như cũ — xác nhận
   bằng cách trỏ `DATABASE_URL` tới host không tồn tại, route vẫn 200.
3. Ghi `search_logs` (không chờ — fire-and-forget, không thêm round-trip vào
   phản hồi) cho MỌI truy vấn, đánh dấu `co_ket_qua`. Xem thống kê tại
   `/quan-tri/tu-khoa-thieu?token=...` (`QUAN_TRI_TOKEN`) — nhóm theo tần suất,
   nguồn thật để mở rộng `ALIAS_HOP_CHAT` theo hành vi người dùng.
4. `/api/cron/sync` (bảo vệ bằng `CRON_SECRET`, lịch trong `vercel.json`) gọi lại
   `dongBoHopChatGiaoDuc()` — hàm dùng chung với `seed-compounds.ts` — để làm mới
   `compound_cache` định kỳ mà không cần chạy tay.

### Độ trễ đo được

Server-side (`EXPLAIN ANALYZE` trên ~70 dòng `compound_aliases`): **< 1ms** —
Postgres còn chọn Sequential Scan thay vì dùng GIN index vì bảng quá nhỏ để
index rẻ hơn seq scan (bình thường, sẽ tự đổi khi bảng lớn hơn). Độ trễ đo được
từ máy dev cục bộ tới Neon (us-east-1) dao động 250ms–2000ms — **hoàn toàn do
khoảng cách mạng** (xác nhận bằng `SELECT 1` trần cũng mất ~250ms), không phải
do câu query. Mục tiêu p95 < 80ms của kế hoạch giả định triển khai thật
(Vercel + Neon cùng khu vực), không đo được chính xác từ môi trường dev này.
