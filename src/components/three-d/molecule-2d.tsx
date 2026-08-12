"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Compound3D } from "@/lib/pubchem";
import { colorFor, useElementColorMap } from "./molecule-surface";

/** Machine/browser has no WebGL (old integrated GPU disabled, driver-blocked, etc.) */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

/**
 * Hydration-safe WebGL detection: getServerSnapshot optimistically returns
 * true (same as during SSR with no document) so the first client-side frame
 * always matches the server HTML — not using useState+useEffect because
 * calling setState in an effect causes an extra unnecessary render
 * (react-hooks/set-state-in-effect).
 */
export function useWebGLSupport(): boolean {
  return useSyncExternalStore(noopSubscribe, hasWebGL, () => true);
}

function atomDisplayRadius(atomicNumber: number): number {
  return atomicNumber === 1 ? 0.31 : atomicNumber >= 9 && atomicNumber <= 17 ? 0.46 : 0.415;
}

/**
 * Fallback when there's no WebGL: project the 3D coordinates onto the XY
 * plane (dropping z) and draw SVG — a pure orthographic projection, so no
 * data accuracy is lost. Atoms are drawn in z order (painter's algorithm) so
 * front layers occlude back ones.
 */
export function Molecule2D({ data }: { data: Compound3D }) {
  const palette = useElementColorMap();
  const { atoms, bonds, queryName } = data;

  const { drawOrder, viewBox } = useMemo(() => {
    if (atoms.length === 0) {
      return { drawOrder: [] as number[], viewBox: { x: -1, y: -1, w: 2, h: 2 } };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const atom of atoms) {
      const radius = atomDisplayRadius(atom.atomicNumber);
      minX = Math.min(minX, atom.x - radius);
      maxX = Math.max(maxX, atom.x + radius);
      minY = Math.min(minY, -atom.y - radius);
      maxY = Math.max(maxY, -atom.y + radius);
    }
    const drawOrder = atoms.map((_, i) => i).sort((a, b) => atoms[a].z - atoms[b].z);
    return { drawOrder, viewBox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
  }, [atoms]);

  if (atoms.length === 0) return null;

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="h-full w-full"
      role="img"
      aria-label={`Sơ đồ phân tử 2D (chiếu trực giao, thay thế mô hình 3D) của ${queryName}: ${atoms.length} nguyên tử, ${bonds.length} liên kết`}
    >
      {bonds.map((bond, i) => {
        const A = atoms[bond.a];
        const B = atoms[bond.b];
        if (!A || !B) return null;
        return (
          <line
            key={`lk-${i}`}
            x1={A.x} y1={-A.y} x2={B.x} y2={-B.y}
            stroke="rgba(242,234,217,0.55)"
            strokeWidth={bond.order >= 2 ? 0.09 : 0.055}
          />
        );
      })}
      {drawOrder.map((i) => {
        const atom = atoms[i];
        return (
          <circle
            key={i}
            cx={atom.x} cy={-atom.y}
            r={atomDisplayRadius(atom.atomicNumber)}
            fill={colorFor(palette, atom.atomicNumber)}
            stroke="rgba(11,10,8,0.5)"
            strokeWidth={0.02}
          />
        );
      })}
    </svg>
  );
}
