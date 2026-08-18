import { LAYOUT_MAP, VIETNAMESE_NAMES, DEFAULT_TRANSLATIONS } from "../element";
import { electronShellConfig } from "../electron-config";
import { callPug, numberOrNull } from "./core";

export interface ElementInfo {
  atomicNumber: number;
  symbol: string;
  englishName: string;
  vietnameseName: string;
  atomicMass: number | null;        // u
  cpkColor: string;                  // "#RRGGBB"
  electronConfig: string;
  electronegativity: number | null;         // Pauling
  radiusPm: number | null;        // pm
  ionizationEnergy: number | null;  // eV
  electronAffinity: number | null;    // eV
  oxidationStates: string;
  rawState: string;            // raw data from the API
  stateOfMatter: "ran" | "long" | "khi" | "chua-xac-dinh";
  /**
   * Certainty of the standard state: PubChem itself flags synthetic superheavy
   * elements — where too few atoms have ever existed to measure a bulk state —
   * with the phrase "Expected to be a ...". This field preserves that signal
   * instead of letting the UI display it as a confidently measured fact.
   */
  stateCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  /**
   * The electron configuration of elements in the same "state not measured"
   * group above has also never been determined by spectroscopic experiment —
   * only theoretical calculation exists. Derived from the SAME source signal
   * (rawState), not made up.
   */
  electronConfigCertainty: "do-dac" | "du-doan" | "chua-xac-dinh";
  meltingPointK: number | null;        // K
  boilingPointK: number | null;             // K
  density: number | null;            // g/cm³
  groupFamilyEn: string;
  groupFamilyVi: string;
  yearDiscovered: string;
  group: number;
  period: number | null;
  displayPeriod: number;
  block: "s" | "p" | "d" | "f";
  electronShells: number[];                 // e- count per shell n=1..7 (from the API's electron config)
}

interface PeriodicTableResponse {
  Table: {
    Columns: { Column: string[] };
    Row: { Cell: string[] }[];
  };
}

function stateOf(rawState: string): ElementInfo["stateOfMatter"] {
  const g = rawState.toLowerCase();
  if (g.includes("solid")) return "ran";
  if (g.includes("liquid")) return "long";
  if (g.includes("gas")) return "khi";
  return "chua-xac-dinh";
}

/** PubChem flags a guess with the phrase "Expected to be a ..." instead of a direct measurement */
function confidenceFromOriginalState(rawState: string): ElementInfo["stateCertainty"] {
  if (!rawState) return "chua-xac-dinh";
  return /expected/i.test(rawState) ? "du-doan" : "do-dac";
}

/**
 * Normalizes a CPK color code from PubChem.
 *
 * PubChem strips leading zeros: Palladium's standard Jmol color is #006985 but
 * the API returns "6985". padStart(6, "F") would turn it into "#FF6985" (pink) —
 * a color code that doesn't exist in any CPK/Jmol standard. Must pad with "0".
 */
export function cpkColorFrom(raw: string | undefined): { hex: string; source: "pubchem" | "mac-dinh" } {
  const v = (raw ?? "").trim();
  if (!/^[0-9A-Fa-f]{1,6}$/.test(v)) return { hex: "#C8C4BC", source: "mac-dinh" };
  return { hex: `#${v.toUpperCase().padStart(6, "0")}`, source: "pubchem" };
}

let elementCount = 0;

export async function fetchAllElements(): Promise<ElementInfo[]> {
  const data = await callPug<PeriodicTableResponse>("/pug/periodictable/JSON");
  if (!data?.Table?.Row?.length) return [];

  const columns = data.Table.Columns.Column;
  const columnIndex = (name: string) => columns.indexOf(name);

  const elements = data.Table.Row.map((row) => {
    const c = row.Cell;
    const atomicNumber = Number(c[columnIndex("AtomicNumber")]);
    const layout = LAYOUT_MAP.get(atomicNumber) ?? { group: 0, displayPeriod: 0, period: null, block: "s" as const };
    const groupFamily = c[columnIndex("GroupBlock")] ?? "";
    return {
      atomicNumber,
      symbol: c[columnIndex("Symbol")] ?? "",
      englishName: c[columnIndex("Name")] ?? "",
      vietnameseName: VIETNAMESE_NAMES[atomicNumber] ?? c[columnIndex("Name")] ?? "",
      atomicMass: numberOrNull(c[columnIndex("AtomicMass")]),
      cpkColor: cpkColorFrom(c[columnIndex("CPKHexColor")]).hex,
      electronConfig: c[columnIndex("ElectronConfiguration")] ?? "",
      electronegativity: numberOrNull(c[columnIndex("Electronegativity")]),
      radiusPm: numberOrNull(c[columnIndex("AtomicRadius")]),
      ionizationEnergy: numberOrNull(c[columnIndex("IonizationEnergy")]),
      electronAffinity: numberOrNull(c[columnIndex("ElectronAffinity")]),
      oxidationStates: c[columnIndex("OxidationStates")] || "—",
      rawState: c[columnIndex("StandardState")] ?? "",
      stateOfMatter: stateOf(c[columnIndex("StandardState")] ?? ""),
      stateCertainty: confidenceFromOriginalState(c[columnIndex("StandardState")] ?? ""),
      electronConfigCertainty: confidenceFromOriginalState(c[columnIndex("StandardState")] ?? ""),
      meltingPointK: numberOrNull(c[columnIndex("MeltingPoint")]),
      boilingPointK: numberOrNull(c[columnIndex("BoilingPoint")]),
      density: numberOrNull(c[columnIndex("Density")]),
      groupFamilyEn: groupFamily,
      groupFamilyVi: DEFAULT_TRANSLATIONS[groupFamily] ?? groupFamily,
      yearDiscovered: c[columnIndex("YearDiscovered")] || "—",
      group: layout.group,
      period: layout.period,
      displayPeriod: layout.displayPeriod,
      block: layout.block,
      electronShells: [] as number[],
    };
  });

  const theoKyHieu = new Map(elements.map((n) => [n.symbol, { electronConfig: n.electronConfig }]));
  elements.forEach((n) => (n.electronShells = electronShellConfig(n.electronConfig, theoKyHieu)));
  elementCount = elements.length;
  return elements;
}

export function loadedElementCount() {
  return elementCount;
}

export async function getElementBySymbol(symbol: string): Promise<ElementInfo | null> {
  const allElements = await fetchAllElements();
  const k = symbol.toLowerCase();
  return allElements.find((n) => n.symbol.toLowerCase() === k) ?? null;
}
