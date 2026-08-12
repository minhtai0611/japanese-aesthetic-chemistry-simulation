/**
 * Calculates molar mass from a parsed formula, then CROSS-CHECKS it against
 * PubChem's value — turns the primary data source into a test harness for
 * our own code, consistent with the project's "0 fabricated data points"
 * philosophy.
 *
 * IMPORTANT: atomic masses are NOT hard-coded here — they always come from
 * fetchAllElements() (PubChem) at runtime, via molarMassBySymbolTable().
 */
import type { ElementInfo } from "@/lib/pubchem";

export function molarMassBySymbolTable(
  elements: readonly Pick<ElementInfo, "symbol" | "atomicMass">[],
): Map<string, number> {
  const table = new Map<string, number>();
  for (const n of elements) {
    if (n.atomicMass != null) table.set(n.symbol, n.atomicMass);
  }
  return table;
}

export function calculateMolarMass(
  elementTable: Record<string, number>,
  massBySymbol: Map<string, number>,
): number {
  let total = 0;
  for (const [symbol, count] of Object.entries(elementTable)) {
    const m = massBySymbol.get(symbol);
    if (m == null) {
      throw new Error(`Unknown atomic mass for "${symbol}" — check the chemical symbol.`);
    }
    total += m * count;
  }
  return total;
}

export interface CrossCheckResult {
  calculatedMass: number;
  pubchemMass: number;
  deviation: number;
  hasWarning: boolean;
}

/** Deviation > 0.5% ⇒ warning — formula or mass table has a problem */
export function crossCheckMolarMass(calculatedMass: number, pubchemMass: number): CrossCheckResult {
  const deviation = pubchemMass === 0 ? 0 : Math.abs(calculatedMass - pubchemMass) / pubchemMass;
  return { calculatedMass, pubchemMass, deviation, hasWarning: deviation > 0.005 };
}
