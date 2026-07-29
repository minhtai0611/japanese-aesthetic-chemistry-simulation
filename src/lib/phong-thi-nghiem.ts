/** Ba phòng thí nghiệm ảo — dùng cho hub /thi-nghiem, route con và điều hướng chéo */
export const CAC_PHONG = [
  {
    slug: "pha-che",
    kanji: "希釈",
    nhan: "Pha chế & pha loãng",
    moTa:
      "Gõ tên chất, PubChem trả về khối lượng mol chính xác đến hàng phần nghìn. Máy nghiền số liệu qua n = m/M và định luật C₁V₁ = C₂V₂, rồi rót dung dịch vào cốc với độ đậm đúng tỉ lệ nồng độ.",
    congThuc: "n = m/M · C = n/V · C₁V₁ = C₂V₂",
  },
  {
    slug: "chuan-do",
    kanji: "滴定",
    nhan: "Chuẩn độ axit–bazơ",
    moTa:
      "Mở khóa burette. Từng giọt bazơ rơi xuống, cân bằng mol H⁺/OH⁻ lật trạng thái, phenolphtalein bừng hồng đúng lúc pH vượt 8,2 — và đường cong chuẩn độ hình thành ngay trước mắt bạn.",
    congThuc: "pH = −log[H⁺] · K_w = 10⁻¹⁴",
  },
  {
    slug: "chuyen-pha",
    kanji: "相転移",
    nhan: "Buồng chuyển pha",
    moTa:
      "Đặt một nguyên tố vào lò. Khi nhiệt độ chạm mốc nóng chảy thật của nó — ví dụ sắt ở 1 811 K — mạng tinh thể sụp đổ thành dòng chảy; qua điểm sôi, từng hạt giành lấy tự do. Hai mốc nhiệt đều là số liệu đo từ PubChem.",
    congThuc: "T < T_nc → rắn · T_nc ≤ T < T_s → lỏng · T ≥ T_s → khí",
  },
  {
    slug: "can-bang",
    kanji: "均衡",
    nhan: "Cân bằng phương trình",
    moTa:
      "Gõ chất phản ứng và sản phẩm — máy dựng ma trận nguyên tố rồi khử Gauss-Jordan trên số hữu tỉ để tìm bộ hệ số nguyên dương nhỏ nhất. Toán tất định 100%, không đoán, không AI.",
    congThuc: "A·x = 0 · khử Gauss trên ℚ · BCNN/UCLN → nghiệm nguyên nhỏ nhất",
  },
] as const;

export type SlugPhong = (typeof CAC_PHONG)[number]["slug"];
