/**
 * Parses a chemical formula into an element-count table — recursive over
 * the string, same family as electron-config.ts (no external library, no AI).
 *
 *   "Ca(OH)2"     → { Ca: 1, O: 2, H: 2 }
 *   "Fe2(SO4)3"   → { Fe: 2, S: 3, O: 12 }
 *   "CuSO4·5H2O"  → { Cu: 1, S: 1, O: 9, H: 10 }   (· or . marks hydration)
 */
export function parseFormula(formula: string): Record<string, number> {
  const segments = formula.trim().split(/[·.]/);
  const totals: Record<string, number> = {};

  segments.forEach((segment, i) => {
    let rest = segment.trim();
    let hydrationCoefficient = 1;
    if (i > 0) {
      const match = rest.match(/^(\d+)(.*)$/);
      if (match) {
        hydrationCoefficient = Number(match[1]);
        rest = match[2];
      }
    }
    if (!rest) return;
    const sub = parseFormulaUnit(rest);
    for (const [element, count] of Object.entries(sub)) {
      totals[element] = (totals[element] ?? 0) + count * hydrationCoefficient;
    }
  });

  return totals;
}

/** Parses one segment with no hydration marker — recursive over parentheses */
function parseFormulaUnit(formula: string): Record<string, number> {
  let i = 0;

  function readNumber(): number {
    let s = "";
    while (i < formula.length && /\d/.test(formula[i])) {
      s += formula[i];
      i++;
    }
    return s ? Number(s) : 1;
  }

  function readSymbol(): string {
    let s = formula[i];
    i++;
    while (i < formula.length && /[a-z]/.test(formula[i])) {
      s += formula[i];
      i++;
    }
    return s;
  }

  function readGroup(): Record<string, number> {
    const result: Record<string, number> = {};
    while (i < formula.length && formula[i] !== ")" && formula[i] !== "]") {
      if (formula[i] === "(" || formula[i] === "[") {
        const closing = formula[i] === "(" ? ")" : "]";
        i++;
        const sub = readGroup();
        if (formula[i] !== closing) {
          throw new Error(`Thiếu dấu đóng ngoặc trong công thức "${formula}"`);
        }
        i++;
        const coefficient = readNumber();
        for (const [element, count] of Object.entries(sub)) {
          result[element] = (result[element] ?? 0) + count * coefficient;
        }
      } else if (/[A-Z]/.test(formula[i])) {
        const element = readSymbol();
        const coefficient = readNumber();
        result[element] = (result[element] ?? 0) + coefficient;
      } else {
        throw new Error(`Ký tự không hợp lệ '${formula[i]}' trong công thức "${formula}"`);
      }
    }
    return result;
  }

  const result = readGroup();
  if (i !== formula.length) {
    throw new Error(`Công thức dư ký tự sau vị trí ${i}: "${formula}"`);
  }
  return result;
}
