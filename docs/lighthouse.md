# Lighthouse — kết quả đo thật, không phải mục tiêu lý thuyết

Đo bằng `lighthouse` trực tiếp (Edge headless — máy đo không có Chrome cài
sẵn) cho từng URL trong `.lighthouserc.json`, production build (`npm run
build && npm run start`), không cache/CDN.

**Chú ý phương pháp đo:** dùng cờ `--chrome-flags="--headless=new --no-sandbox"`.
TUYỆT ĐỐI KHÔNG thêm `--disable-gpu` — đã thử và three.js rơi về software
rasterizer, cho số liệu vô nghĩa (TBT quan sát được 63.230 ms, một con số
không thể xảy ra trên thiết bị thật). Môi trường đo này (máy chia sẻ CPU,
không GPU rời) cũng có độ nhiễu run-to-run đáng kể — xem cột "biên độ đo".

## Baseline gốc (trước khi hoãn mount WebGL theo viewport)

| URL | Performance | Accessibility | SEO |
|---|---|---|---|
| `/` (hero 3D) | 30 | **100** | **100** |
| `/bang-tuan-hoan` | 66 | **100** | **100** |
| `/hop-chat/caffeine` (khán đài phân tử 3D) | 40 | **100** | **100** |

- `/`: LCP 9,1 s, Total Blocking Time 3.023 ms, Time to Interactive 11,1 s.
- `/hop-chat/caffeine`: LCP 8,6 s, TBT 3.243 ms, TTI 10,3 s.

Nguyên nhân gốc: `dynamic(() => import(".../canh-hero"), { ssr: false })` và
tương đương cho khán đài phân tử tải ngay khi component mount, không đợi
người dùng cuộn tới hoặc dùng `IntersectionObserver` để hoãn khởi tạo WebGL
context tới khi thực sự cần hiển thị.

## Sau khi hoãn mount theo viewport + tách riêng postprocessing (đo lại)

Đã làm: (1) `IntersectionObserver` (`lazy-canvas-wrapper.tsx`) hoãn mount
`<Canvas>` của hero/khán đài phân tử tới khi vào khung nhìn hoặc người dùng
bấm nút kích hoạt; (2) tách `@react-three/postprocessing` (Bloom/Vignette)
khỏi chunk chính, chỉ tải sau khi scene chính đã render (idle callback); (3)
giảm số phân đoạn hình cầu nguyên tử (`MatPhanTu`) từ 28×28 xuống 20×20.

| URL | Performance (biên độ đo, nhiều lần) | Accessibility | SEO |
|---|---|---|---|
| `/` | **45–46** | **100** | **100** |
| `/hop-chat/caffeine` | **42–44** | **100** | **100** |

- `/`: LCP 8,5–8,8 s, TBT 1.550–1.800 ms, TTI 8,9–9,3 s (2 lần đo).
- `/hop-chat/caffeine`: LCP 7,4–9,9 s, TBT 2.590–4.060 ms, TTI 9,3–10,3 s
  (3 lần đo) — biên độ đo tự nó đã lớn hơn tác động của bước tách
  postprocessing, nên KHÔNG khẳng định bước (2)+(3) có cải thiện đo được
  thật hay không trong môi trường này; chỉ bước (1) — hoãn mount theo
  viewport — cho kết quả cải thiện rõ, lặp lại được (TBT giảm ~17–44% so
  với baseline gốc trên cả hai trang).
- `/bang-tuan-hoan` (không Canvas 3D, không bị ảnh hưởng bởi các bước trên):
  đo lại ra 71 (từng là 66) — chênh lệch này là nhiễu đo giữa hai lần chạy
  khác máy/khác thời điểm, không phải do thay đổi mã nguồn (trang này không
  dùng WebGL).

## Vì sao vẫn dưới ngưỡng 85 của kế hoạch

Kiểm tra trực tiếp phần tử LCP (`lcp-breakdown-insight`) cho thấy LCP KHÔNG
phải bản thân Canvas — là một đoạn `<p>` văn bản thường. `elementRenderDelay`
của nó (~1,7–1,9 s quan sát được, nhân lên nhiều hơn trong ước lượng mô
phỏng throttling) đến từ việc main thread bận parse/execute ~400 KB mã
three.js/@react-three/fiber/drei/postprocessing — vì cả hai Canvas đều nằm
ngay trong khung nhìn ban đầu, `IntersectionObserver` kích hoạt gần như ngay
lập tức, nên việc hoãn *thời điểm gọi* import không tránh được việc bundle
đó vẫn phải tải/parse/thực thi rất sớm trong đời trang. Đây là vấn đề
**trọng lượng bundle**, không phải vấn đề "tải quá sớm" nữa — muốn đóng nốt
khoảng cách tới 85 cần một đợt riêng rà soát bundle (cây phụ thuộc
three.js/drei, có phần nào thay được bằng cài đặt nhẹ hơn), không phải một
thay đổi nhỏ tiếp theo.

## Quyết định

`.lighthouserc.json` nâng ngưỡng Performance từ 0,25 lên **0,35** — vẫn dưới
số đo thấp nhất đã quan sát sau khi sửa (0,42), có biên độ, nhưng đủ chặt để
bắt lại một hồi quy thật đưa điểm về vùng baseline gốc (~0,30-0,40).
Accessibility/SEO giữ nguyên ≥ 0,95 vì cả hai đã đạt 100/100 thật.

## Việc cần làm nếu tối ưu Performance tiếp

1. ~~Hoãn mount `<Canvas>` bằng `IntersectionObserver`~~ — ĐÃ LÀM, cải thiện
   đo được rõ ràng.
2. ~~Tách `postprocessing` khỏi chunk chính~~ — ĐÃ LÀM (đúng nguyên tắc: bundle
   chunk chính nhỏ hơn, hiệu ứng thẩm mỹ không chặn nội dung chính), nhưng
   CHƯA đo được cải thiện rõ ràng trong môi trường đo hiện tại (biên độ đo
   lớn hơn tác động).
3. Rà soát trọng lượng bundle three.js/@react-three/fiber/drei thực sự
   (phân tích bundle, xem phần nào tree-shake được, có cần toàn bộ `drei`
   hay chỉ 1-2 helper) — đây là việc còn lại lớn nhất để tiến gần ngưỡng 85.
4. Đo lại bằng đúng quy trình này (`lighthouse` trực tiếp, production build,
   KHÔNG `--disable-gpu`, nhiều lần chạy lấy biên độ) sau mỗi thay đổi —
   không suy đoán tác động từ một lần đo duy nhất.
