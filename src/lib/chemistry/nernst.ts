/**
 * Electrochemistry: Galvanic cell (Daniell-cell-style), Nernst equation
 * applied generally to EACH half-cell (correct even when the two electrodes
 * exchange different numbers of electrons — the simplified formula
 * E_cell = E°_cat - E°_an - (RT/nF)ln([An]/[Cat]) from the original plan
 * file is only correct when both electrodes have the SAME n).
 *
 * For the reduction M^n+ + n e⁻ → M(s), solid-metal activity = 1, so
 * Q = 1/[M^n+], giving:
 *   E = E° + (RT / nF)·ln([M^n+])
 * then E_cell = E_cathode − E_anode. When n_anode = n_cathode = n, this
 * expression correctly reduces to the simplified formula above (see plan file).
 *
 * ΔG° = −n_total·F·E°_cell, where n_total = LCM(n_anode, n_cathode) — the
 * actual number of electrons exchanged in the OVERALL balanced reaction,
 * not the n of a single half-reaction.
 *
 * H (Z=1, SHE) is a FIXED reference electrode — Nernst concentration
 * correction is not applied to it (see standard-electrode-potential.ts).
 */
import { getStandardElectrodePotential } from "./standard-electrode-potential";

const GAS_CONSTANT = 8.314; // R, J/(mol·K)
const FARADAY_CONSTANT = 96485; // F, C/mol
const HYDROGEN_ATOMIC_NUMBER = 1;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export interface ElectrochemistryResult {
  anodeAtomicNumber: number;
  cathodeAtomicNumber: number;
  /** ACTUAL electrode potential of the anode after Nernst concentration correction, V */
  eAnode: number;
  /** ACTUAL electrode potential of the cathode after Nernst concentration correction, V */
  eCathode: number;
  /** Standard E°_cell (concentration = 1M, 298.15K), V */
  eoCell: number;
  /** Actual E_cell at the given concentration, V */
  eCell: number;
  /** ΔG° of the balanced overall reaction, kJ/mol */
  deltaG0: number;
  /** true if E_cell (actual, at the given concentration) > 0 */
  isSpontaneous: boolean;
}

/**
 * Computes a Galvanic cell's potential from the atomic numbers of the two
 * electrodes. Returns null if pinned E° data is missing for either one, or
 * if the two electrodes are identical (not a real cell).
 */
export function calculateElectrochemistry(
  electrodeA: number,
  electrodeB: number,
  concentrationA: number = 1.0,
  concentrationB: number = 1.0,
  temperatureKelvin: number = 298.15,
): ElectrochemistryResult | null {
  if (electrodeA === electrodeB) return null;
  const a = getStandardElectrodePotential(electrodeA);
  const b = getStandardElectrodePotential(electrodeB);
  if (!a || !b) return null;

  const aIsAnode = a.eV <= b.eV;
  const anodeAtomicNumber = aIsAnode ? electrodeA : electrodeB;
  const anodeData = aIsAnode ? a : b;
  const anodeConcentration = aIsAnode ? concentrationA : concentrationB;
  const cathodeAtomicNumber = aIsAnode ? electrodeB : electrodeA;
  const cathodeData = aIsAnode ? b : a;
  const cathodeConcentration = aIsAnode ? concentrationB : concentrationA;

  const actualElectrodePotential = (atomicNumber: number, data: { eV: number; n: number }, concentration: number) =>
    atomicNumber === HYDROGEN_ATOMIC_NUMBER
      ? data.eV
      : data.eV + ((GAS_CONSTANT * temperatureKelvin) / (data.n * FARADAY_CONSTANT)) * Math.log(concentration);

  const eAnode = actualElectrodePotential(anodeAtomicNumber, anodeData, anodeConcentration);
  const eCathode = actualElectrodePotential(cathodeAtomicNumber, cathodeData, cathodeConcentration);
  const eoCell = cathodeData.eV - anodeData.eV;
  const eCell = eCathode - eAnode;
  const totalElectrons = lcm(anodeData.n, cathodeData.n);
  const deltaG0 = (-totalElectrons * FARADAY_CONSTANT * eoCell) / 1000;

  return {
    anodeAtomicNumber,
    cathodeAtomicNumber,
    eAnode,
    eCathode,
    eoCell,
    eCell,
    deltaG0,
    isSpontaneous: eCell > 0,
  };
}
