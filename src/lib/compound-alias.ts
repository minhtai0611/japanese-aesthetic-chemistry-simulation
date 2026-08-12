/**
 * Vietnamese aliases for common compounds → the real PubChem lookup name (English/IUPAC).
 * This is NOT chemistry data — just a name-translation table to find the right PubChem record.
 * The chemistry values still always come directly from PubChem after the name is translated.
 */
export const COMPOUND_ALIASES: Readonly<Record<string, string>> = {
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
  "axit sunfuric": "sulfuric acid",
};

function normalizeKeyword(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const NORMALIZED_ALIASES = new Map(
  Object.entries(COMPOUND_ALIASES).map(([vi, en]) => [normalizeKeyword(vi), en]),
);

// Only keys with Vietnamese diacritics are used as display suggestions (skips the duplicate unaccented forms).
const DISPLAY_ALIASES = Object.keys(COMPOUND_ALIASES).filter((vi) => /[à-ỹ]/i.test(vi));

/** Translates a Vietnamese alias to the real PubChem name; returns the input unchanged if no alias matches */
export function translateCompoundName(keyword: string): string {
  const t = keyword.trim();
  return NORMALIZED_ALIASES.get(normalizeKeyword(t)) ?? t;
}

/** Suggests Vietnamese names matching the prefix the user is typing (diacritic-insensitive) */
export function suggestVietnameseName(keyword: string): string[] {
  const t = normalizeKeyword(keyword);
  if (t.length < 2) return [];
  return DISPLAY_ALIASES.filter((vi) => normalizeKeyword(vi).startsWith(t)).slice(0, 5);
}
