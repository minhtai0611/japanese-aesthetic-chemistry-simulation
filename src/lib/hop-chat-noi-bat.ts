/**
 * Danh mục hợp chất tiêu biểu — dùng cho gợi ý nhanh, generateStaticParams và
 * "hợp chất liên quan". `co3D: false` đánh dấu chất PubChem CÓ thuộc tính
 * nhưng KHÔNG có conformer 3D (record_type=3d 404) — trang vẫn render 200,
 * chỉ hiện banner giải thích thay vì mô hình 3D.
 */
export const HOP_CHAT_NOI_BAT = [
  { ten: "benzene", nhan: "Benzene — vòng thơm", co3D: true },
  { ten: "caffeine", nhan: "Caffeine", co3D: true },
  { ten: "aspirin", nhan: "Aspirin", co3D: true },
  { ten: "glucose", nhan: "Glucose", co3D: true },
  { ten: "water", nhan: "Nước", co3D: true },
  { ten: "ethanol", nhan: "Ethanol", co3D: true },
  { ten: "chlorophyll a", nhan: "Diệp lục", co3D: false },
  { ten: "adenosine triphosphate", nhan: "ATP", co3D: true },
] as const;
