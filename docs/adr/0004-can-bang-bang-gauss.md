# ADR 0004 — Cân bằng phương trình bằng đại số tuyến tính, không dùng thư viện ngoài

## Bối cảnh

Phòng thí nghiệm "Cân bằng phương trình" (`/thi-nghiem/can-bang`) nhận vế
trái/phải một phản ứng hoá học (ví dụ `KMnO4 + HCl` → `KCl + MnCl2 + Cl2 +
H2O`) và phải trả về đúng bộ hệ số nguyên dương nhỏ nhất — không đoán, không
gọi mô hình ngôn ngữ để "đề xuất" một đáp án nghe hợp lý.

Có sẵn các gói npm cân bằng phương trình hoá học, nhưng phần lớn dùng số
dấu phẩy động (floating-point) nội bộ để giải hệ phương trình tuyến tính —
rủi ro sai số tích luỹ đúng ở bước quan trọng nhất: khử Gauss trên một ma
trận có thể gần suy biến, nơi sai số dấu phẩy động có thể biến một hệ số
đúng thành gần-đúng (ví dụ `2.0000000003` thay vì `2`), rồi làm tròn sai.

## Quyết định

Tự viết bộ giải trên **số hữu tỉ chính xác tuyệt đối** (`src/lib/hoa-hoc/can-bang.ts`):

1. Dựng ma trận `A` (hàng = nguyên tố, cột = chất; hệ số vế phải mang dấu âm)
   từ chính parser công thức đã có (`phanTichCongThuc`) — không phân tích cú
   pháp hoá học riêng cho module này.
2. Giải hệ thuần nhất `A·x = 0` bằng khử Gauss-Jordan, nhưng **mọi phép tính
   trên phân số `bigint`/`bigint`** (lớp `PhanSo` tự viết) — cộng/trừ/nhân/chia
   phân số giữ nguyên dạng tử/mẫu, không bao giờ ép về số thực trung gian.
   Không có bước nào có thể tích luỹ sai số dấu phẩy động, vì không có số
   dấu phẩy động nào tham gia.
3. Sau khi tìm được nghiệm (không gian nghiệm đúng 1 chiều — điều kiện cần
   cho một phương trình hoá học cân bằng được), quy đồng mẫu số chung
   (BCNN) rồi rút gọn về ước số chung lớn nhất (UCLN) — cho ra bộ hệ số
   nguyên dương nhỏ nhất, đúng là thứ sách giáo khoa yêu cầu.
4. Nghiệm có dấu âm hoặc lẫn lộn dấu bị từ chối tường minh (`return null`) —
   đó là dấu hiệu phương trình không cân bằng được với đúng số chất đã cho,
   không phải một lỗi cần che giấu.

## Vì sao không dùng thư viện ngoài

- **Kiểm chứng được 100%:** thuật toán kinh điển (khử Gauss-Jordan, BCNN/UCLN)
  nằm gọn trong một file, đọc được từ đầu đến cuối, test bằng chính 50
  phương trình thật của chương trình hoá học phổ thông Việt Nam
  (`tests/unit/can-bang.test.ts`) — đối chiếu bảo toàn nguyên tố ở cả hai vế
  cho từng nghiệm, không chỉ so khớp hệ số kỳ vọng chép tay (dễ sai khi chép
  lại).
- **Không có phụ thuộc runtime mới** để theo dõi lỗ hổng bảo mật hay phá vỡ
  tương thích ở một bản cập nhật tương lai, cho một bài toán đủ nhỏ để tự
  viết đúng và tự kiểm chứng.
- **Số học chính xác tuyệt đối** loại bỏ hẳn lớp lỗi "hệ số gần đúng" mà một
  thư viện dùng floating-point nội bộ có thể mắc phải trên ma trận gần suy
  biến — quan trọng cho một sản phẩm giáo dục nơi *mọi* con số hiển thị phải
  đúng tuyệt đối, không phải "đủ gần".

## Hệ quả

- BigInt literal (`0n`/`1n`) không dùng được vì `tsconfig.json` của repo
  target ES2017 (cũ hơn ES2020) — mọi hằng số BigInt viết bằng constructor
  `BigInt(0)`/`BigInt(1)` thay vì cú pháp chữ.
- Cùng bộ giải này được tái sử dụng làm nguồn "đáp án đúng tuyệt đối" cho bộ
  sinh đề bài tập cân bằng phương trình (Phase 7, `sinhDeCanBang`) — một
  thuật toán, hai tính năng, không có bản sao logic thứ hai có thể lệch nhau.
