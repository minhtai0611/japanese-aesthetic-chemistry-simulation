/**
 * SIÊU DỮ LIỆU TRÌNH BÀY — không chứa số liệu hóa học đo lường.
 *
 * Tọa độ lưới (nhóm/chu kì) của bảng tuần hoàn là cách bố trí chuẩn quốc tế
 * (hệ tọa độ hiển thị), được dùng để dựng giao diện 18 cột.
 * Mọi đại lượng vật lý/hóa học (khối lượng, nhiệt độ nóng chảy, độ âm điện…)
 * đều được lấy TRỰC TIẾP từ PubChem PUG-REST — xem `src/lib/pubchem.ts`.
 * Tên tiếng Việt là lớp bản địa hóa của ký danh IUPAC đang được API trả về.
 */

export type KhoiKinh = "s" | "p" | "d" | "f";

export interface BoTriBang {
  nhom: number;          // cột hiển thị 1–18
  chuKiHienThi: number;  // hàng hiển thị 1–9 (8 = lanthan, 9 = actini)
  chuKi: number | null;  // chu kì thực 1–7 (null với cặp lanthan/actini đặt lưới)
  khoi: KhoiKinh;
}

function day(z0: number, z1: number, nhom0: number, chuKi: number): [number, number, number][] {
  const ra: [number, number, number][] = [];
  for (let z = z0; z <= z1; z++) ra.push([z, nhom0 + (z - z0), chuKi]);
  return ra;
}

/** [số hiệu nguyên tử, nhóm, hàng hiển thị] — bố trí chuẩn 18 cột */
const LUGI_BO_TRI: [number, number, number][] = [
  [1, 1, 1],
  [2, 18, 1],
  ...day(3, 4, 1, 2),
  ...day(5, 10, 13, 2),
  ...day(11, 12, 1, 3),
  ...day(13, 18, 13, 3),
  ...day(19, 36, 1, 4),
  ...day(37, 54, 1, 5),
  [55, 1, 6],
  [56, 2, 6],
  ...day(57, 71, 4, 8), // La → Lu : hàng lanthan
  ...day(72, 86, 4, 6),
  [87, 1, 7],
  [88, 2, 7],
  ...day(89, 103, 4, 9), // Ac → Lr : hàng actini
  ...day(104, 118, 4, 7),
];

function khoiCua(nhom: number, hangHienThi: number): KhoiKinh {
  if (hangHienThi >= 8) return "f";
  if (nhom <= 2) return "s";
  if (nhom >= 13) return "p";
  return "d";
}

export const BO_TRI: ReadonlyMap<number, BoTriBang> = new Map(
  LUGI_BO_TRI.map(([so, nhom, hang]) => [
    so,
    {
      nhom,
      chuKiHienThi: hang,
      chuKi: hang === 8 ? 6 : hang === 9 ? 7 : hang,
      khoi: khoiCua(nhom, hang),
    },
  ]),
);

/** Tên gọi tiếng Việt (bản địa hóa ký danh IUPAC — không phải số liệu đo) */
export const TEN_VI: Readonly<Record<number, string>> = {
  1: "Hiđrô", 2: "Heli", 3: "Liti", 4: "Beri", 5: "Bo", 6: "Cacbon",
  7: "Nitơ", 8: "Oxi", 9: "Flo", 10: "Neon", 11: "Natri", 12: "Magie",
  13: "Nhôm", 14: "Silic", 15: "Photpho", 16: "Lưu huỳnh", 17: "Clo",
  18: "Argon", 19: "Kali", 20: "Canxi", 21: "Scandi", 22: "Titan",
  23: "Vanadi", 24: "Crom", 25: "Mangan", 26: "Sắt", 27: "Coban",
  28: "Niken", 29: "Đồng", 30: "Kẽm", 31: "Gali", 32: "Gemani",
  33: "Asen", 34: "Selen", 35: "Brom", 36: "Kripton", 37: "Rubiđi",
  38: "Stronti", 39: "Ytri", 40: "Zirconi", 41: "Niobi", 42: "Molipđen",
  43: "Tecnexi", 44: "Ruteni", 45: "Rođi", 46: "Palađi", 47: "Bạc",
  48: "Cađimi", 49: "Inđi", 50: "Thiếc", 51: "Antimon", 52: "Telua",
  53: "Iốt", 54: "Xenon", 55: "Xesi", 56: "Bari", 57: "Lantan",
  58: "Xeri", 59: "Praseođim", 60: "Neođim", 61: "Prometi", 62: "Samari",
  63: "Europi", 64: "Gadođini", 65: "Tecbi", 66: "Đyprozi", 67: "Honmi",
  68: "Erbi", 69: "Tuli", 70: "Ytecbi", 71: "Luxeti", 72: "Hafni",
  73: "Tantan", 74: "Vonfram", 75: "Reni", 76: "Osimi", 77: "Iriđi",
  78: "Platin", 79: "Vàng", 80: "Thủy ngân", 81: "Tali", 82: "Chì",
  83: "Bitmut", 84: "Poloni", 85: "Astatin", 86: "Rađon", 87: "Franxi",
  88: "Rađi", 89: "Actini", 90: "Thori", 91: "Protactini", 92: "Urani",
  93: "Neptuni", 94: "Plutoni", 95: "Americi", 96: "Curi", 97: "Berkeli",
  98: "Californi", 99: "Ensteni", 100: "Fecmi", 101: "Menđelevi",
  102: "Nobeli", 103: "Lorensi", 104: "Rutherfordi", 105: "Dubni",
  106: "Seaborgi", 107: "Bohri", 108: "Hassi", 109: "Meitneri",
  110: "Darmstati", 111: "Roentgeni", 112: "Copernici", 113: "Nihoni",
  114: "Fleri", 115: "Moscovi", 116: "Livermori", 117: "Tennessin",
  118: "Oganesson",
};

export const NHAN_KHOI: Record<KhoiKinh, string> = {
  s: "Khối s",
  p: "Khối p",
  d: "Khối d",
  f: "Khối f",
};

/** Bảng màu khối — bảng màu Nhật: chu-hồng, lam-nhạt, kim, xanh-tokiwa */
export const MAU_KHOI: Record<KhoiKinh, string> = {
  s: "#e06534",
  p: "#6b8ecb",
  d: "#b98c36",
  f: "#5aa892",
};

export const DICH_GIA_DINH: Record<string, string> = {
  "Nonmetal": "Phi kim",
  "Noble gas": "Khí hiếm",
  "Alkali metal": "Kim loại kiềm",
  "Alkaline earth metal": "Kim loại kiềm thổ",
  "Metalloid": "Á kim",
  "Halogen": "Halogen",
  "Post-transition metal": "Kim loại sau chuyển tiếp",
  "Transition metal": "Kim loại chuyển tiếp",
  "Lanthanide": "Họ Lanthan",
  "Actinide": "Họ Actini",
};
