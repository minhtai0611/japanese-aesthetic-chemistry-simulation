"use client";

import { useEffect, useMemo, useState } from "react";
import "@react-three/fiber";
import * as THREE from "three";
import type { Compound3D } from "@/lib/pubchem";

/* ----------------------------- Element color table ----------------------------- */

export interface ElementColor {
  cpkColor: string;
  symbol: string;
  vietnameseName: string;
}

const colorCache: { promise?: Promise<Map<number, ElementColor>>; ready?: Map<number, ElementColor> } = {};

/** Loads the real CPK color table for all 118 elements from the internal API (cached once per session) */
export function useElementColorMap(): Map<number, ElementColor> | null {
  const [palette, setPalette] = useState<Map<number, ElementColor> | null>(colorCache.ready ?? null);
  useEffect(() => {
    if (colorCache.ready) return;
    colorCache.promise ??= fetch("/api/elements")
      .then(async (r) => {
        if (!r.ok) return new Map<number, ElementColor>();
        const list = (await r.json()) as { atomicNumber: number; cpkColor: string; symbol: string; vietnameseName: string }[];
        const m = new Map<number, ElementColor>();
        for (const n of list) m.set(n.atomicNumber, { cpkColor: n.cpkColor, symbol: n.symbol, vietnameseName: n.vietnameseName });
        return m;
      })
      .catch(() => new Map<number, ElementColor>());
    void colorCache.promise.then((m) => {
      colorCache.ready = m;
      setPalette(m);
    });
  }, []);
  return palette;
}

/* ------------------------------ Molecule mesh assembly ------------------------------ */

const AXIS_Y = new THREE.Vector3(0, 1, 0);

interface BondSegment {
  from: THREE.Vector3;
  to: THREE.Vector3;
  length: number;
  rotation: THREE.Quaternion;
  mid: THREE.Vector3;
  colorA: string;
  colorB: string;
  radius: number;
  offset: THREE.Vector3 | null;
}

export function colorFor(palette: Map<number, ElementColor> | null, atomicNumber: number): string {
  if (palette?.get(atomicNumber)?.cpkColor) return palette.get(atomicNumber)!.cpkColor;
  if (atomicNumber === 1) return "#e8e2d4";
  return "#c9a35a";
}

export function MoleculeSurface({
  data,
  palette,
  glowIntensity = 0.35,
}: {
  data: Compound3D;
  palette: Map<number, ElementColor> | null;
  glowIntensity?: number;
}) {
  const { atoms, bonds } = data;

  const bondSegments = useMemo<BondSegment[]>(() => {
    const segments: BondSegment[] = [];
    for (const bond of bonds) {
      const A = atoms[bond.a];
      const B = atoms[bond.b];
      if (!A || !B) continue;
      const from = new THREE.Vector3(A.x, A.y, A.z);
      const to = new THREE.Vector3(B.x, B.y, B.z);
      const direction = to.clone().sub(from);
      const length = direction.length();
      if (length < 1e-4) continue;
      direction.normalize();
      const rotation = new THREE.Quaternion().setFromUnitVectors(AXIS_Y, direction);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const colorA = colorFor(palette, A.atomicNumber);
      const colorB = colorFor(palette, B.atomicNumber);

      if (bond.order <= 1) {
        segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.085, offset: null });
      } else {
        let perp = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 0, 1));
        if (perp.lengthSq() < 1e-3) perp = new THREE.Vector3().crossVectors(direction, AXIS_Y);
        perp.normalize();
        const step = 0.105;
        if (bond.order === 2) {
          segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.062, offset: perp.clone().multiplyScalar(step) });
          segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.062, offset: perp.clone().multiplyScalar(-step) });
        } else {
          segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.052, offset: null });
          segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.052, offset: perp.clone().multiplyScalar(step * 1.6) });
          segments.push({ from, to, length, rotation, mid, colorA, colorB, radius: 0.052, offset: perp.clone().multiplyScalar(-step * 1.6) });
        }
      }
    }
    return segments;
  }, [atoms, bonds, palette]);

  const atomRadii = useMemo(() => {
    const m = new Map<number, number>();
    for (const atom of atoms) {
      if (!m.has(atom.atomicNumber)) {
        m.set(atom.atomicNumber, atom.atomicNumber === 1 ? 0.31 : atom.atomicNumber >= 9 && atom.atomicNumber <= 17 ? 0.46 : 0.415);
      }
    }
    return m;
  }, [atoms]);

  return (
    <group>
      {atoms.map((atom, i) => {
        const color = colorFor(palette, atom.atomicNumber);
        return (
          <mesh key={`nt-${i}`} position={[atom.x, atom.y, atom.z]}>
            <sphereGeometry args={[atomRadii.get(atom.atomicNumber) ?? 0.42, 20, 20]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glowIntensity}
              roughness={0.32}
              metalness={0.18}
            />
          </mesh>
        );
      })}
      {bondSegments.map((bond, i) => {
        const midA = bond.from.clone().lerp(bond.mid, 0.5);
        const midB = bond.mid.clone().lerp(bond.to, 0.5);
        const halfLength = bond.length / 2;
        const offset = bond.offset ?? new THREE.Vector3();
        return (
          <group key={`lk-${i}`}>
            <mesh
              position={midA.clone().add(offset)}
              quaternion={bond.rotation}
            >
              <cylinderGeometry args={[bond.radius, bond.radius, halfLength, 12, 1]} />
              <meshStandardMaterial color={bond.colorA} roughness={0.4} metalness={0.15} />
            </mesh>
            <mesh position={midB.clone().add(offset)} quaternion={bond.rotation}>
              <cylinderGeometry args={[bond.radius, bond.radius, halfLength, 12, 1]} />
              <meshStandardMaterial color={bond.colorB} roughness={0.4} metalness={0.15} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function boundingRadius(data: Compound3D | null): number {
  if (!data || data.atoms.length === 0) return 1.6;
  let m = 0;
  for (const atom of data.atoms) m = Math.max(m, Math.hypot(atom.x, atom.y, atom.z));
  return Math.max(m + 0.7, 1.4);
}

export { AXIS_Y };
