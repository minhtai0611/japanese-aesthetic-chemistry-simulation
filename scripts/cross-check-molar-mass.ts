/**
 * Cross-checks calculateMolarMass (parser + Gauss elimination from PHASE 5)
 * against PubChem's REAL molar mass over 200 substances — turns the primary
 * data source into a test harness for our own code.
 *
 * Uses CID 1..200 (PubChem's real identifiers) instead of hand-picking
 * substance names — avoids inventing a list of 200 substances, and gives a
 * reproducible result.
 *
 * Does NOT run in CI/`npm test` — needs a real network connection to
 * PubChem, takes a few minutes (the semaphore in pubchem.ts self-throttles).
 * Run by hand when a cross-check is needed:
 * `npx tsx scripts/cross-check-molar-mass.ts`.
 */
import "dotenv/config";
import { fetchAllElements, fetchCompound } from "../src/lib/pubchem";
import { parseFormula } from "../src/lib/chemistry/formula-parser";
import { calculateMolarMass, molarMassBySymbolTable, crossCheckMolarMass } from "../src/lib/chemistry/molar-mass";

const SUBSTANCE_COUNT = 200;

async function main() {
  const elements = await fetchAllElements();
  const massTable = molarMassBySymbolTable(elements);
  console.log(`Bảng khối lượng nguyên tử: ${massTable.size}/118 nguyên tố có giá trị đo được từ PubChem.`);

  const sampleCids = Array.from({ length: SUBSTANCE_COUNT }, (_, i) => String(i + 1));

  let checkedCount = 0;
  let skippedNoDataCount = 0;
  let skippedUnknownElementCount = 0;
  let warningCount = 0;
  const warningDetails: string[] = [];

  for (const cid of sampleCids) {
    const compound = await fetchCompound(cid);
    if (!compound || !compound.formula || compound.molarMass == null) {
      skippedNoDataCount++;
      continue;
    }

    let elementTable: Record<string, number>;
    try {
      elementTable = parseFormula(compound.formula);
    } catch {
      skippedNoDataCount++; // the PubChem formula has a notation the parser doesn't yet handle (e.g. D/T isotopes)
      continue;
    }

    let calculatedMass: number;
    try {
      calculatedMass = calculateMolarMass(elementTable, massTable);
    } catch {
      skippedUnknownElementCount++;
      continue;
    }

    checkedCount++;
    const result = crossCheckMolarMass(calculatedMass, compound.molarMass);
    if (result.hasWarning) {
      warningCount++;
      warningDetails.push(
        `CID ${cid} (${compound.formula}): tính=${calculatedMass.toFixed(3)} pubchem=${compound.molarMass} lệch=${(result.deviation * 100).toFixed(2)}%`,
      );
    }
  }

  console.log(
    `\nĐối chiếu ${checkedCount}/${SUBSTANCE_COUNT} chất (bỏ qua ${skippedNoDataCount} không đủ dữ liệu/parser, ${skippedUnknownElementCount} có nguyên tố lạ).`,
  );
  console.log(`Cảnh báo lệch > 0.5%: ${warningCount}/${checkedCount}.`);
  warningDetails.forEach((d) => console.log(" -", d));
  process.exit(0);
}

main();
