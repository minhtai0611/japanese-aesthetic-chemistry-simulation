/**
 * Alias tiếng Việt cho hợp chất phổ biến → tên tra cứu PubChem thật (tiếng Anh/IUPAC).
 * Đây KHÔNG phải dữ liệu hóa học — chỉ là bảng dịch tên để tìm đúng bản ghi PubChem.
 * Giá trị hóa học vẫn luôn lấy trực tiếp từ PubChem sau khi dịch tên.
 */
export const ALIAS_HOP_CHAT: Readonly<Record<string, string>> = {
  "nước": "water",
  "nuoc": "water",
  "muối": "sodium chloride",
  "muối ăn": "sodium chloride",
  "muoi": "sodium chloride",
  "muoi an": "sodium chloride",
  "đường": "glucose",
  "duong": "glucose",
  "cồn": "ethanol",
  "con": "ethanol",
  "rượu": "ethanol",
  "ruou": "ethanol",
  "giấm": "acetic acid",
  "giam": "acetic acid",
  "xút": "sodium hydroxide",
  "xut": "sodium hydroxide",
  "amoniac": "ammonia",
  "amôniac": "ammonia",
  "thuốc tím": "potassium permanganate",
  "thuoc tim": "potassium permanganate",
  "vitamin c": "ascorbic acid",
  "baking soda": "sodium bicarbonate",
  "muối nở": "sodium bicarbonate",
  "muoi no": "sodium bicarbonate",
  "đá vôi": "calcium carbonate",
  "da voi": "calcium carbonate",
  "thạch cao": "calcium sulfate",
  "thach cao": "calcium sulfate",
  "phèn chua": "potassium aluminum sulfate",
  "phen chua": "potassium aluminum sulfate",
  "nước oxy già": "hydrogen peroxide",
  "oxy già": "hydrogen peroxide",
  "oxy gia": "hydrogen peroxide",
  "javel": "sodium hypochlorite",
  "nước javel": "sodium hypochlorite",
  "khí carbonic": "carbon dioxide",
  "cacbonic": "carbon dioxide",
  "đá khô": "carbon dioxide",
  "da kho": "carbon dioxide",
};

function chuanHoaTuKhoa(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const ALIAS_CHUAN_HOA = new Map(
  Object.entries(ALIAS_HOP_CHAT).map(([vi, en]) => [chuanHoaTuKhoa(vi), en]),
);

// Chỉ các khóa có dấu tiếng Việt được dùng làm gợi ý hiển thị (bỏ bản không dấu trùng lặp).
const CAC_ALIAS_HIEN_THI = Object.keys(ALIAS_HOP_CHAT).filter((vi) => /[à-ỹ]/i.test(vi));

/** Dịch alias tiếng Việt sang tên PubChem thật; trả về nguyên văn nếu không khớp alias nào */
export function dichTenHopChat(tuKhoa: string): string {
  const t = tuKhoa.trim();
  return ALIAS_CHUAN_HOA.get(chuanHoaTuKhoa(t)) ?? t;
}

/** Gợi ý tên tiếng Việt khớp tiền tố người dùng đang gõ (không phân biệt dấu) */
export function goiYTenTiengViet(tuKhoa: string): string[] {
  const t = chuanHoaTuKhoa(tuKhoa);
  if (t.length < 2) return [];
  return CAC_ALIAS_HIEN_THI.filter((vi) => chuanHoaTuKhoa(vi).startsWith(t)).slice(0, 5);
}
