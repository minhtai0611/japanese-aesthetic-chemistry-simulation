export const SITE = {
  name: "KAGAKU",
  kanji: "科学",
  tagline: "かがく — Phòng thí nghiệm hóa học số",
  description:
    "Phòng thí nghiệm hóa học ảo tiếng Việt: mô phỏng tương tác 3D, bảng tuần hoàn 118 nguyên tố và tra cứu hợp chất — toàn bộ số liệu trực tiếp từ PubChem PUG-REST, nguồn mở của NCBI.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const NAVIGATION = [
  { href: "/", label: "Trang chủ", kanji: "表" },
  { href: "/periodic-table", label: "Bảng tuần hoàn", kanji: "周期" },
  { href: "/experiments", label: "Thí nghiệm ảo", kanji: "実験" },
  { href: "/compound", label: "Hợp chất 3D", kanji: "分子" },
] as const;

export const DATA_SOURCES = {
  name: "PubChem PUG-REST",
  provider: "National Center for Biotechnology Information (NCBI)",
  url: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest",
  scope: "Bảng tuần hoàn nguyên tố · Thuộc tính hợp chất · Tọa độ 3D phân tử",
} as const;
