# ADR 0002 — Chuẩn hoá slug hợp chất về ASCII: khử nguyên nhân, không vá điểm rò rỉ

## Bối cảnh

14/39 khoá alias tiếng Việt trong `ALIAS_HOP_CHAT` trả về HTTP 500 khi truy cập
trực tiếp: `/hop-chat/nước`, `/hop-chat/đường`, `/hop-chat/muối`, `/hop-chat/cồn`…
Trong khi đó `/hop-chat/nuoc` (không dấu) trả 200 bình thường.

Thử nhị phân trên từng ký tự của các chuỗi lỗi cho thấy ranh giới **chính
xác** tại U+00FF: mọi ký tự ≤ U+00FF (bảng Latin-1) qua được, mọi ký tự
> U+00FF (nguyên âm có dấu tiếng Việt: `ư`, `ơ`, `ộ`…) đều sập. Đối chiếu
cùng một chuỗi encode gọi API route (`/api/hop-chat/[ten]`) và OG-image route
(`/hop-chat/-/opengraph-image`) — cả hai đều trả 200 với ký tự y hệt — chỉ
riêng Page component ở dynamic segment `/hop-chat/[ten]/page.tsx` mới 500.

Bằng chứng này loại trừ giả thuyết ban đầu ("PubChem không nhận ký tự
Unicode") — vấn đề nằm ở tầng định tuyến Next.js xử lý dynamic segment vượt
Latin-1, không phải ở lời gọi PubChem.

## Quyết định

Không đi vá từng route bị ảnh hưởng (API route đã ổn, chỉ Page mới lỗi) — mà
dựng một **tầng định danh chất** (`src/lib/dinh-danh-chat.ts`) làm nguồn sự
thật duy nhất cho việc "thứ người dùng gõ" → "định danh chuẩn":

1. **URL canonical LUÔN là ASCII.** `slugCanonical()` bỏ dấu tiếng Việt
   (NFD + strip combining marks), giữ nguyên gạch nối và dấu phẩy (có nghĩa
   trong danh pháp IUPAC, ví dụ `1,3,7-trimethylxanthine`).
2. Mọi biến thể có dấu/khoảng trắng thừa → `permanentRedirect` 308 về bản
   canonical, không bao giờ render Page với ký tự vượt Latin-1.
3. `cacBienTheTraCuu()` thử theo thứ tự: nguyên văn giữ gạch nối trước, alias
   tiếng Việt sau, và **chỉ cuối cùng** mới thử biến gạch nối thành dấu cách —
   vì PubChem phân biệt thật `1,3,7-trimethylxanthine` (200) với
   `1,3,7 trimethylxanthine` (404); đổi mù quáng sẽ tạo lỗi mới trong lúc sửa
   lỗi cũ.

## Vì sao không tìm chỗ encode

Sửa từng nơi ký tự Unicode bị chặn (thêm `decodeURIComponent` ở đây, ép kiểu
route param ở kia…) chỉ che triệu chứng tại đúng những chỗ đã bị phát hiện —
lần tới có route mới dùng cùng dynamic segment sẽ lại sập theo đúng cách cũ.
Khử nguyên nhân — không bao giờ để ký tự > U+00FF chạm tới Page component —
loại bỏ toàn bộ lớp lỗi một lần, không phụ thuộc việc nhớ áp lại bản vá ở mọi
route tương lai.

## Hệ quả

- Whitelist giáo dục (ADR 0003) được xây dựng trên chính `slugCanonical()`
  này — một hàm, hai lợi ích.
- Mọi alias mới thêm vào `ALIAS_HOP_CHAT` tự động an toàn — không cần kiểm
  tra tay từng chuỗi có ký tự gì.
- Chi phí: một lượt redirect 308 cho mọi URL không-ASCII — chấp nhận được vì
  đổi lấy loại bỏ hẳn một lớp lỗi 500 sản xuất.
