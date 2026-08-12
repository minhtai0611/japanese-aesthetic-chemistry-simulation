/**
 * PRESENTATION METADATA ONLY — contains no measured chemistry data.
 *
 * The periodic table's grid coordinates (group/period) follow the standard
 * international layout (a display coordinate system), used to build the
 * 18-column UI. Every physical/chemical quantity (mass, melting point,
 * electronegativity…) comes DIRECTLY from PubChem PUG-REST — see
 * `src/lib/pubchem.ts`. The Vietnamese name is a localization layer over the
 * IUPAC designation the API returns.
 */

export type ElementBlock = "s" | "p" | "d" | "f";

export interface TableLayout {
  group: number;          // display column 1–18
  displayPeriod: number;  // display row 1–9 (8 = lanthanides, 9 = actinides)
  period: number | null;  // real period 1–7 (null for the lanthanide/actinide grid rows)
  block: ElementBlock;
}

function range(z0: number, z1: number, group0: number, period: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let z = z0; z <= z1; z++) out.push([z, group0 + (z - z0), period]);
  return out;
}

/** [atomic number, group, display row] — standard 18-column layout */
const GRID_LAYOUT: [number, number, number][] = [
  [1, 1, 1],
  [2, 18, 1],
  ...range(3, 4, 1, 2),
  ...range(5, 10, 13, 2),
  ...range(11, 12, 1, 3),
  ...range(13, 18, 13, 3),
  ...range(19, 36, 1, 4),
  ...range(37, 54, 1, 5),
  [55, 1, 6],
  [56, 2, 6],
  ...range(57, 71, 4, 8), // La → Lu : lanthanide row
  ...range(72, 86, 4, 6),
  [87, 1, 7],
  [88, 2, 7],
  ...range(89, 103, 4, 9), // Ac → Lr : actinide row
  ...range(104, 118, 4, 7),
];

function blockOf(group: number, displayRow: number): ElementBlock {
  if (displayRow >= 8) return "f";
  if (group <= 2) return "s";
  if (group >= 13) return "p";
  return "d";
}

export const LAYOUT_MAP: ReadonlyMap<number, TableLayout> = new Map(
  GRID_LAYOUT.map(([atomicNumber, group, row]) => [
    atomicNumber,
    {
      group,
      displayPeriod: row,
      period: row === 8 ? 6 : row === 9 ? 7 : row,
      block: blockOf(group, row),
    },
  ]),
);

/** Vietnamese names (a localization of the IUPAC designation — not measured data) */
export const VIETNAMESE_NAMES: Readonly<Record<number, string>> = {
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

export const BLOCK_LABELS: Record<ElementBlock, string> = {
  s: "Khối s",
  p: "Khối p",
  d: "Khối d",
  f: "Khối f",
};

/** Block color palette — Japanese palette: vermilion, pale blue, gold, tokiwa green */
export const BLOCK_COLORS: Record<ElementBlock, string> = {
  s: "#e06534",
  p: "#6b8ecb",
  d: "#b98c36",
  f: "#5aa892",
};

export const DEFAULT_TRANSLATIONS: Record<string, string> = {
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
