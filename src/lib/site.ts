export const SITE = {
  ten: "KAGAKU",
  kanji: "科学",
  khauHieu: "かがく — Phòng thí nghiệm hóa học số",
  moTa:
    "Phòng thí nghiệm hóa học ảo tiếng Việt: mô phỏng tương tác 3D, bảng tuần hoàn 118 nguyên tố và tra cứu hợp chất — toàn bộ số liệu trực tiếp từ PubChem PUG-REST, nguồn mở của NCBI.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const DIEU_HUONG = [
  { href: "/", nhan: "Trang chủ", kanji: "表" },
  { href: "/bang-tuan-hoan", nhan: "Bảng tuần hoàn", kanji: "周期" },
  { href: "/thi-nghiem", nhan: "Thí nghiệm ảo", kanji: "実験" },
  { href: "/hop-chat", nhan: "Hợp chất 3D", kanji: "分子" },
] as const;

export const NGUON_DU_LIEU = {
  ten: "PubChem PUG-REST",
  nhaCungCap: "National Center for Biotechnology Information (NCBI)",
  url: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest",
  phamVi: "Bảng tuần hoàn nguyên tố · Thuộc tính hợp chất · Tọa độ 3D phân tử",
} as const;
