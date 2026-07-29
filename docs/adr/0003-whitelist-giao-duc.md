# ADR 0003 — Whitelist giáo dục: giới hạn index khi upstream có hơn 100 triệu chất

## Bối cảnh

`/hop-chat/[ten]` tra cứu trực tiếp PUG-REST của PubChem — một cơ sở dữ liệu
công cộng với hơn 100 triệu hợp chất, không có khái niệm "phù hợp học sinh
cấp 3" hay "an toàn để quảng bá". Route nhận bất kỳ tên nào và trả về đúng
những gì PubChem có.

Hệ quả cụ thể đã quan sát được: `/hop-chat/love` trả về MDA (chất ma tuý tổng
hợp), `/hop-chat/sunshine` trả về LSD — cả hai đều là tên lóng tiếng Anh có
thật trên PubChem. Một sản phẩm giáo dục hoá học cho học sinh phổ thông vô
tình dựng permalink, cho index, và gắn OG-image quảng bá cho các chất này chỉ
vì route không phân biệt được "chất trong chương trình học" với "bất kỳ chất
nào PubChem biết tới".

## Quyết định

1. **Không chặn tri thức** — mọi chất PubChem có vẫn xem được ở
   `/hop-chat/{ten}`, số liệu vẫn lấy thật, không có "danh sách đen" chặn
   truy cập.
2. **Chỉ giới hạn những gì được prerender + cho phép index.** Chất ngoài
   whitelist giáo dục vẫn render 200 bình thường, nhưng kèm banner "Ngoài
   chương trình phổ thông" và thẻ `robots: { index: false }` — Google không
   lập chỉ mục, nhưng người dùng gõ đúng tên vẫn tra cứu được.
3. **Whitelist suy trực tiếp từ hai danh mục đã có sẵn trong repo, không tự
   đặt thêm entry mới:**

   ```ts
   // src/lib/dinh-danh-chat.ts
   for (const { ten } of HOP_CHAT_NOI_BAT) theoSlug.set(slugCanonical(ten), ...);
   for (const [vi, en] of Object.entries(ALIAS_HOP_CHAT)) { ... }
   export const CHAT_GIAO_DUC: readonly ChatGiaoDuc[] = [...theoSlug.values()];
   ```

   `HOP_CHAT_NOI_BAT` (các chất nổi bật có mô hình 3D) và `ALIAS_HOP_CHAT`
   (39 khoá tiếng Việt tác giả đã tuyển cho tính năng tìm kiếm) — hai danh
   mục này *chính là* danh mục giáo dục thật của sản phẩm, được tuyển từ
   trước vì lý do khác (nổi bật, có bản dịch tiếng Việt), không phải một
   danh sách tay mới bịa ra riêng cho việc lọc nội dung.

## Vì sao không tự viết danh sách "chất an toàn" riêng

Một danh sách kiểm duyệt riêng sẽ là điểm dữ liệu tự chế thứ hai cần duy trì
song song với `ALIAS_HOP_CHAT`/`HOP_CHAT_NOI_BAT` — hai nguồn dễ lệch nhau
theo thời gian (thêm alias mới mà quên thêm vào whitelist, hoặc ngược lại).
Suy trực tiếp từ danh mục đã tồn tại vì lý do sản phẩm khác nghĩa là whitelist
luôn nhất quán với "những chất trang này thực sự giới thiệu", không cần đồng
bộ tay hai nơi.

## Hệ quả

- Whitelist dùng chung `slugCanonical()` (ADR 0002) nên tự động không phân
  biệt `nước`/`nuoc`/`NƯỚC`.
- `generateStaticParams()` chỉ prerender whitelist — build không nổ ra hàng
  trăm triệu trang tĩnh.
- Nếu tương lai mở rộng chương trình học (thêm alias/chất nổi bật mới),
  whitelist tự lớn theo — không có bước "nhớ cập nhật danh sách lọc" riêng.
