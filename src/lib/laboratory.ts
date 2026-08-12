/** The five virtual labs — used by the /experiments hub, its sub-routes, and cross-navigation */
export const LABS = [
  {
    slug: "preparation",
    kanji: "希釈",
    label: "Pha chế & pha loãng",
    description:
      "Gõ tên chất, PubChem trả về khối lượng mol chính xác đến hàng phần nghìn. Máy nghiền số liệu qua n = m/M và định luật C₁V₁ = C₂V₂, rồi rót dung dịch vào cốc với độ đậm đúng tỉ lệ nồng độ.",
    formula: "n = m/M · C = n/V · C₁V₁ = C₂V₂",
  },
  {
    slug: "titration",
    kanji: "滴定",
    label: "Chuẩn độ axit–bazơ",
    description:
      "Mở khóa burette. Từng giọt bazơ rơi xuống, cân bằng mol H⁺/OH⁻ lật trạng thái, phenolphtalein bừng hồng đúng lúc pH vượt 8,2 — và đường cong chuẩn độ hình thành ngay trước mắt bạn.",
    formula: "pH = −log[H⁺] · K_w = 10⁻¹⁴",
  },
  {
    slug: "phase-change",
    kanji: "相転移",
    label: "Buồng chuyển pha",
    description:
      "Đặt một nguyên tố vào lò rồi kéo cả nhiệt độ lẫn áp suất. Điểm nóng chảy là số liệu đo từ PubChem; điểm sôi dịch chuyển thật theo áp suất qua phương trình Clausius-Clapeyron, vẽ thành đường ranh giới sống động trên giản đồ pha P-T.",
    formula: "ln(P/P₁) = -(ΔH_vap/R)(1/T - 1/T₁)",
  },
  {
    slug: "equilibrium",
    kanji: "均衡",
    label: "Cân bằng phương trình",
    description:
      "Gõ chất phản ứng và sản phẩm — máy dựng ma trận nguyên tố rồi khử Gauss-Jordan trên số hữu tỉ để tìm bộ hệ số nguyên dương nhỏ nhất. Toán tất định 100%, không đoán, không AI.",
    formula: "A·x = 0 · khử Gauss trên ℚ · BCNN/UCLN → nghiệm nguyên nhỏ nhất",
  },
  {
    slug: "electrochemical-cell",
    kanji: "電池",
    label: "Pin điện hóa Galvanic",
    description:
      "Chọn hai kim loại làm điện cực — máy tra thế điện cực chuẩn đã ghim (CRC Handbook of Chemistry and Physics), tính điện thế pin thật qua phương trình Nernst theo nồng độ ion bạn kéo, rồi suy ra ΔG° của phản ứng oxi hóa-khử tổng quát.",
    formula: "E = E° + (RT/nF)ln[Mⁿ⁺] · E_cell = E_cathode − E_anode · ΔG° = −nFE°_cell",
  },
] as const;

export type LabSlug = (typeof LABS)[number]["slug"];
