import { COORD_SCALE_3D } from "./coordinate-scale-3d";

/** Minimal 3D point — doesn't depend on THREE.Vector3 so this module is testable
 * with plain Vitest (environment: "node"), no need for WebGL/jsdom. */
export interface PointXYZ {
  x: number;
  y: number;
  z: number;
}

/** Euclidean distance in three.js scene units (already scaled by COORD_SCALE_3D). */
export function rawDistance(a: PointXYZ, b: PointXYZ): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Real distance (Å) — divides back out the scale factor to recover the original
 * PubChem conformer coordinates. Defaults to the exact factor fetchCompound3D applied. */
export function actualDistanceAngstrom(a: PointXYZ, b: PointXYZ, scaleFactor: number = COORD_SCALE_3D): number {
  return rawDistance(a, b) / scaleFactor;
}

/**
 * The A-B-C bond angle at vertex B (degrees), via the dot product of the two
 * vectors BA and BC. The angle does NOT depend on the coordinate scale factor
 * (scaled evenly on every axis) — no need to divide out COORD_SCALE_3D here,
 * unlike distance.
 */
export function bondAngleDegrees(a: PointXYZ, b: PointXYZ, c: PointXYZ): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const lengthBA = Math.hypot(ba.x, ba.y, ba.z);
  const lengthBC = Math.hypot(bc.x, bc.y, bc.z);
  if (lengthBA < 1e-9 || lengthBC < 1e-9) return NaN;
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const cosAngle = Math.min(1, Math.max(-1, dot / (lengthBA * lengthBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

export type SelectedAtom = number[];

/**
 * Atom-selection cycle for measuring: up to 3 picks (A, B=vertex, C).
 * Already have 3 selected → the 4th click starts a fresh selection.
 * Clicking an already-selected atom → ignored (avoids a degenerate pair/triangle).
 */
export function addAtomSelection(current: SelectedAtom, index: number): SelectedAtom {
  if (current.includes(index)) return current;
  if (current.length >= 3) return [index];
  return [...current, index];
}

export type MeasurementResult =
  | { kind: "khoangCach"; a: number; b: number; angstrom: number }
  | { kind: "goc"; a: number; b: number; c: number; degrees: number }
  | null;

/** Computes the measurement result from the atom list (coordinates scaled by COORD_SCALE_3D) + current selection. */
export function calculateMeasurementResult(atoms: PointXYZ[], selected: SelectedAtom): MeasurementResult {
  if (selected.length === 2) {
    const [a, b] = selected;
    const A = atoms[a];
    const B = atoms[b];
    if (!A || !B) return null;
    return { kind: "khoangCach", a, b, angstrom: actualDistanceAngstrom(A, B) };
  }
  if (selected.length === 3) {
    const [a, b, c] = selected;
    const A = atoms[a];
    const B = atoms[b];
    const C = atoms[c];
    if (!A || !B || !C) return null;
    return { kind: "goc", a, b, c, degrees: bondAngleDegrees(A, B, C) };
  }
  return null;
}
