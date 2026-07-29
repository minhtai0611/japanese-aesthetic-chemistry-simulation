# ADR 0001 — Tầng độ tin cậy dữ liệu: phân biệt đo đạc vs dự đoán

## Bối cảnh

PubChem trả về trạng thái vật chất và cấu hình electron cho toàn bộ 118
nguyên tố qua `/rest/pug/periodictable/JSON`, kể cả các nguyên tố siêu nặng
tổng hợp (Z ≥ 104) chưa từng được quan sát ở lượng đủ để đo trực tiếp. Với
những nguyên tố này, PubChem không xoá trống trường `StandardState` — thay
vào đó ghi rõ bằng lời, ví dụ `"Expected to be a Solid"` thay vì `"Solid"`.

Nếu website hiển thị mọi nguyên tố như nhau ("Oganesson: Rắn"), đó là bịa đặt
độ chắc chắn mà PubChem không hề khẳng định — vi phạm nguyên tắc "0 điểm dữ
liệu tự chế" của dự án.

## Quyết định

Suy độ tin cậy **trực tiếp từ chính câu chữ** PubChem trả về, không dùng một
danh sách cứng "26 nguyên tố chưa đo được":

```ts
// src/lib/pubchem.ts
function doTinCayTuTrangThaiGoc(goc: string): NguyenTo["trangThaiCertainty"] {
  if (!goc) return "chua-xac-dinh";
  return /expected/i.test(goc) ? "du-doan" : "do-dac";
}
```

Cùng một hàm suy ra cả `trangThaiCertainty` (trạng thái vật chất) lẫn
`cauHinhElectronCertainty` (cấu hình electron) — vì cả hai đều đến từ cùng
một tín hiệu nguồn (`StandardState`), không phải hai bảng tra độc lập dễ lệch
pha khi PubChem cập nhật dữ liệu.

Ba mức kết quả:
- `"do-dac"` — PubChem khẳng định thẳng, không có từ "expected"
- `"du-doan"` — PubChem tự gắn nhãn "expected" (suy luận, chưa đo)
- `"chua-xac-dinh"` — trường trống, không đủ căn cứ để nói gì

UI hiển thị tương ứng: bảng tuần hoàn gắn dấu `*` bên số hiệu nguyên tử, trang
`/nguyen-to/[kyhieu]` ghi rõ "Dự đoán: …" trước tên trạng thái, và buồng
chuyển pha (Phase 6, §9.7) khoá chọn — nhưng vẫn hiển thị trong danh sách kèm
chú thích — các nguyên tố không đủ số liệu nóng chảy/sôi đo được.

## Vì sao không hard-code

Một danh sách tay "các nguyên tố dự đoán" sẽ:
1. Lệch khỏi thực tế ngay khi PubChem đo được thêm một nguyên tố mới (Z=119,
   120… đang được các phòng thí nghiệm theo đuổi) — phải nhớ cập nhật tay,
   dễ quên.
2. Là chính dạng "điểm dữ liệu tự chế" mà dự án cam kết không làm — gán nhãn
   "dự đoán" cho một nguyên tố mà không dựa trên tín hiệu thật từ nguồn.

Suy trực tiếp từ câu chữ nguồn nghĩa là nhãn "dự đoán" luôn khớp với những gì
PubChem *thực sự* nói tại thời điểm truy vấn — tự động đúng khi nguồn cập
nhật, không cần sửa code.

## Hệ quả

- Thêm state thứ ba (`"chua-xac-dinh"`) buộc mọi nơi hiển thị phải xử lý rõ
  ràng trường hợp "không có dữ liệu" thay vì ngầm coi là `false`/`đo-dac`.
- Cách tiếp cận này chỉ hoạt động vì PubChem code hoá độ chắc chắn ngay trong
  câu chữ trả về — với một API khác không có quy ước tương tự, sẽ cần chiến
  lược suy luận khác (ví dụ đối chiếu chéo nhiều nguồn).
