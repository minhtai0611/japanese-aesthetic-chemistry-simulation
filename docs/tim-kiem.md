# Kiến trúc tìm kiếm hợp chất/nguyên tố

## Đang hoạt động (không cần DB)

- **Alias tiếng Việt** (`src/lib/alias-hop-chat.ts`): các tên gọi phổ biến (nước, muối,
  đường, cồn, giấm, xút, thuốc tím, baking soda…) được dịch sang tên PubChem thật
  trước khi tra cứu (`layHopChat`, `layHopChat3D`) và trước khi gọi autocomplete
  (`layGoiY`). Đây là bảng dịch tên, **không phải** dữ liệu hóa học.
- **Tra theo CID**: nếu từ khóa toàn số, hệ thống tra thẳng
  `/compound/cid/{cid}` thay vì `/compound/name/{ten}` — gõ CID PubChem (ví dụ
  `2519` cho caffeine) ra đúng kết quả.
- Gợi ý (`/api/goi-y`) gộp cả alias tiếng Việt khớp tiền tố lẫn autocomplete gốc của
  PubChem, khử trùng lặp.

## Sẵn sàng nhưng CHƯA nối dây (cần Postgres thật)

Schema trong `src/db/schema.ts` định nghĩa 5 bảng cho lớp tìm kiếm/cache nội bộ:

| Bảng | Vai trò |
|---|---|
| `compound_cache` | Cache thuộc tính hợp chất đã tra để giảm số lần gọi PubChem |
| `compound_aliases` | Alias hợp chất tiếng Việt/Anh, có chỉ mục GIN trên `to_tsvector('simple', alias)` |
| `featured_compounds` | Danh sách hợp chất có permalink (`/hop-chat/[slug]`), thay cho hằng số tĩnh `HOP_CHAT_NOI_BAT` |
| `element_aliases` | Alias nguyên tố tiếng Việt, mở rộng ngoài bảng tĩnh `TEN_VI` |
| `search_logs` | Nhật ký truy vấn không ra kết quả, dùng để bổ sung alias theo thời gian |

Migration đầu tiên đã được sinh sẵn tại `drizzle/0000_init_search_index.sql`
(bằng `npx drizzle-kit generate`) và đã kiểm tra DDL hợp lệ (đúng cú pháp
`CREATE INDEX ... USING gin (to_tsvector(...))`), nhưng **chưa được áp dụng hay
kiểm thử trên một Postgres thật** trong phiên làm việc này (không có
`DATABASE_URL` khả dụng ngoài placeholder trong `.env.example`).

### Cách kích hoạt

```bash
# 1. Trỏ DATABASE_URL tới Postgres thật (Neon hoặc tương đương)
npm run db:push          # áp schema (hoặc: npx drizzle-kit migrate để chạy migration đã sinh)

# 2. Seed alias ban đầu (ví dụ, viết script một lần hoặc chèn tay):
#    INSERT INTO compound_aliases (cid, alias, ngon_ngu) VALUES (2519, 'caffein', 'vi');
#    INSERT INTO featured_compounds (cid, slug, thu_tu) VALUES (2519, 'caffeine', 1);
```

### Luồng tra cứu dự kiến khi đã nối dây

1. Tìm trong `compound_aliases`/`compound_cache` (Postgres, nhanh, không phụ
   thuộc giới hạn tần suất PubChem) bằng
   `to_tsvector('simple', alias) @@ plainto_tsquery('simple', $1)` + `ts_rank`.
2. Nếu không có kết quả → gọi PubChem như hiện tại, rồi ghi vào `compound_cache`
   để lần sau tra nhanh hơn.
3. Ghi `search_logs` cho các từ khóa không ra kết quả ở cả hai bước, để người
   vận hành xem lại định kỳ và bổ sung `compound_aliases` thủ công.

Bước này **cố ý chưa viết code runtime gọi `db` cho luồng tìm kiếm**, vì không
thể xác minh nó chạy đúng trên một Postgres thật trong phiên này — nối dây một
đường dẫn DB không kiểm chứng được có thể âm thầm hỏng khi lên production.
Khi có `DATABASE_URL` thật, bước tiếp theo là viết `src/lib/search.ts` gọi
`db.select()...` theo luồng trên và test bằng dữ liệu seed thật.
