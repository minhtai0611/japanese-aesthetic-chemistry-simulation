/**
 * Balances a chemical equation using linear algebra.
 *
 * Builds matrix A (rows = elements, columns = substances; right-hand side is
 * negated), solves the homogeneous system A·x = 0 via Gauss-Jordan
 * elimination OVER RATIONAL NUMBERS (bigint numerator/denominator, avoiding
 * floating-point error), then normalizes the solution to the smallest
 * positive integer coefficients using LCM/GCD. Classic, deterministic,
 * 100% verifiable algorithm. NO AI used.
 *
 * Uses BigInt(0)/BigInt(1) instead of the 0n/1n literal syntax — this repo's
 * tsconfig.json targets ES2017, older than the ES2020 required for BigInt
 * literal syntax.
 */
import { parseFormula } from "./formula-parser";

const ZERO = BigInt(0);
const ONE = BigInt(1);

function gcd(a: bigint, b: bigint): bigint {
  a = a < ZERO ? -a : a;
  b = b < ZERO ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: bigint, b: bigint): bigint {
  if (a === ZERO || b === ZERO) return ZERO;
  return (a / gcd(a, b)) * b;
}

/** Bigint fraction, always self-reducing and keeping a positive denominator */
class Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint, denominator: bigint = ONE) {
    if (denominator === ZERO) throw new Error("Mẫu số bằng 0");
    if (denominator < ZERO) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const d = gcd(numerator, denominator);
    this.numerator = d === ZERO ? ZERO : numerator / d;
    this.denominator = d === ZERO ? denominator : denominator / d;
  }

  static of(n: number | bigint): Fraction {
    return new Fraction(BigInt(n), ONE);
  }

  add(k: Fraction): Fraction {
    return new Fraction(this.numerator * k.denominator + k.numerator * this.denominator, this.denominator * k.denominator);
  }
  subtract(k: Fraction): Fraction {
    return new Fraction(this.numerator * k.denominator - k.numerator * this.denominator, this.denominator * k.denominator);
  }
  multiply(k: Fraction): Fraction {
    return new Fraction(this.numerator * k.numerator, this.denominator * k.denominator);
  }
  divide(k: Fraction): Fraction {
    if (k.numerator === ZERO) throw new Error("Chia cho 0");
    return new Fraction(this.numerator * k.denominator, this.denominator * k.numerator);
  }
  negate(): Fraction {
    return new Fraction(-this.numerator, this.denominator);
  }
  isZero(): boolean {
    return this.numerator === ZERO;
  }
}

/**
 * Solves the homogeneous system A·x = 0 via Gauss-Jordan elimination,
 * returning the smallest positive integer solution if the solution space is
 * exactly 1-dimensional (degrees of freedom = 1) — the necessary condition
 * for a chemical equation to be balanceable. Returns null if not satisfied
 * (no nonzero solution, or the solution space is not uniquely determined).
 */
function solveHomogeneousSystem(initialMatrix: Fraction[][], columnCount: number): bigint[] | null {
  const rows = initialMatrix.map((r) => [...r]);
  const rowCount = rows.length;
  let currentRow = 0;
  const pivotColumns: number[] = [];

  for (let col = 0; col < columnCount && currentRow < rowCount; col++) {
    let pivotRow = -1;
    for (let r = currentRow; r < rowCount; r++) {
      if (!rows[r][col].isZero()) {
        pivotRow = r;
        break;
      }
    }
    if (pivotRow === -1) continue;

    [rows[currentRow], rows[pivotRow]] = [rows[pivotRow], rows[currentRow]];

    const piv = rows[currentRow][col];
    rows[currentRow] = rows[currentRow].map((x) => x.divide(piv));

    for (let r = 0; r < rowCount; r++) {
      if (r === currentRow) continue;
      const coefficient = rows[r][col];
      if (coefficient.isZero()) continue;
      rows[r] = rows[r].map((x, c) => x.subtract(coefficient.multiply(rows[currentRow][c])));
    }

    pivotColumns.push(col);
    currentRow++;
  }

  const freeColumns: number[] = [];
  for (let c = 0; c < columnCount; c++) if (!pivotColumns.includes(c)) freeColumns.push(c);
  if (freeColumns.length !== 1) return null;

  const freeColumn = freeColumns[0];
  const x: Fraction[] = new Array(columnCount).fill(Fraction.of(0));
  x[freeColumn] = Fraction.of(1);
  pivotColumns.forEach((col, i) => {
    x[col] = rows[i][freeColumn].negate();
  });

  let commonDenominator = ONE;
  for (const frac of x) commonDenominator = lcm(commonDenominator, frac.denominator) || commonDenominator;

  let integers = x.map((frac) => frac.numerator * (commonDenominator / frac.denominator));
  if (integers.some((n) => n < ZERO)) integers = integers.map((n) => -n);
  if (integers.some((n) => n <= ZERO)) return null; // mixed signs — not a valid chemistry solution

  const divisor = integers.reduce((a, b) => gcd(a, b), ZERO);
  if (divisor > ONE) integers = integers.map((n) => n / divisor);

  return integers;
}

export type BalanceResult =
  | { ok: true; leftCoefficients: number[]; rightCoefficients: number[] }
  | { ok: false; reason: string };

export function balanceEquation(leftSide: string[], rightSide: string[]): BalanceResult {
  if (leftSide.length === 0 || rightSide.length === 0) {
    return { ok: false, reason: "Cần ít nhất một chất ở mỗi vế." };
  }

  let leftTables: Record<string, number>[];
  let rightTables: Record<string, number>[];
  try {
    leftTables = leftSide.map(parseFormula);
    rightTables = rightSide.map(parseFormula);
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Công thức không hợp lệ." };
  }

  const allElements = [...new Set([...leftTables, ...rightTables].flatMap((b) => Object.keys(b)))];
  const columnCount = leftSide.length + rightSide.length;

  const A: Fraction[][] = allElements.map((element) => {
    const row: Fraction[] = [];
    leftTables.forEach((b) => row.push(Fraction.of(b[element] ?? 0)));
    rightTables.forEach((b) => row.push(Fraction.of(-(b[element] ?? 0))));
    return row;
  });

  const solution = solveHomogeneousSystem(A, columnCount);
  if (!solution) {
    return {
      ok: false,
      reason: "Không tìm được hệ số nguyên dương duy nhất — kiểm tra lại công thức hoặc số chất ở hai vế.",
    };
  }

  const coefficients = solution.map(Number);
  return {
    ok: true,
    leftCoefficients: coefficients.slice(0, leftSide.length),
    rightCoefficients: coefficients.slice(leftSide.length),
  };
}
