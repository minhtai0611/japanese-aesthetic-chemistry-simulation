/** pH of a strong acid–strong base solution from moles & Kw = 1e-14 (25 °C) — pure math, no inference */
export function titrationPH(Ca: number, Va: number, Cb: number, Vb: number): number {
  const molH = Ca * Va; // mmol H⁺
  const molOH = Cb * Vb; // mmol OH⁻
  const total = Va + Vb; // mL  (mmol/mL === mol/L)
  const diff = molH - molOH;
  if (Math.abs(diff) / total < 1e-9) return 7;
  if (diff > 0) return -Math.log10(diff / total);
  return 14 + Math.log10(-diff / total);
}

/** Volume of base needed to fully neutralize the initial strong acid */
export function equivalenceVolume(Ca: number, Va: number, Cb: number): number {
  return (Ca * Va) / Cb;
}

/**
 * Are we currently at the equivalence point?
 *
 * A ±0.5% window around the equivalence volume — narrow enough that the
 * displayed pH never contradicts the label. The old window (±maxVolume/120,
 * ≈ ±2% Veq over the default slider range) was wide enough that at a Vb off
 * by 0.1–0.4 mL from the equivalence point, the label still read "pH = 7"
 * while the real pH had already dropped to 3.0–3.7 — a contradiction shown
 * directly on the teaching screen.
 */
export function isEquivalencePoint(ca: number, va: number, cb: number, vb: number): boolean {
  const veq = equivalenceVolume(ca, va, cb);
  return Math.abs(vb - veq) <= veq * 0.005;
}
