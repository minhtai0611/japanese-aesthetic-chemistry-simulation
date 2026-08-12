"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { Compound3D } from "@/lib/pubchem";
import {
  addAtomSelection,
  calculateMeasurementResult,
  type SelectedAtom,
  type MeasurementResult,
} from "@/lib/measurement-geometry";

/** Atom display radius — SAME ad-hoc formula already used in molecule-surface.tsx
 * and molecule-2d.tsx (not changing molecule-surface.tsx to keep the same component
 * shared with hero-scene.tsx — see the impact analysis in the plan). */
function displayRadius(so: number): number {
  return so === 1 ? 0.31 : so >= 9 && so <= 17 ? 0.46 : 0.415;
}

const DRAG_THRESHOLD_PX = 5;
const TIME_THRESHOLD_MS = 400;

function SelectableAtom({
  i,
  position,
  radius,
  selected,
  hovering,
  onHover,
  onAtomClick,
}: {
  i: number;
  position: [number, number, number];
  radius: number;
  selected: boolean;
  hovering: boolean;
  onHover: (i: number | null) => void;
  onAtomClick: (i: number) => void;
}) {
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(null);
  useCursor(hovering);

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pointerDownRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const down = pointerDownRef.current;
      pointerDownRef.current = null;
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const moved = Math.hypot(dx, dy);
      const elapsed = performance.now() - down.t;
      // A click-drag-rotate (OrbitControls) does not count as an atom selection.
      if (moved <= DRAG_THRESHOLD_PX && elapsed <= TIME_THRESHOLD_MS) {
        onAtomClick(i);
      }
    },
    [i, onAtomClick],
  );

  return (
    <mesh
      position={position}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(i);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
    >
      <sphereGeometry args={[radius * 1.12, 16, 16]} />
      <meshBasicMaterial
        color={selected ? "#ffffff" : "#ffffff"}
        wireframe
        transparent
        opacity={selected ? 0.9 : hovering ? 0.35 : 0}
        depthWrite={false}
      />
    </mesh>
  );
}

export function MeasurementLayer({
  data,
  onMeasurementChange,
}: {
  data: Compound3D;
  onMeasurementChange?: (k: MeasurementResult) => void;
}) {
  const [selection, setSelection] = useState<SelectedAtom>([]);
  const [hover, setHover] = useState<number | null>(null);

  // Molecule changed (new cid) → reset the selection right during render (the
  // official React pattern, same as soTruoc in phase-change-lab.tsx), avoiding
  // stale atom indices pointing at the wrong new molecule's data.
  const [previousCid, setPreviousCid] = useState(data.cid);
  if (data.cid !== previousCid) {
    setPreviousCid(data.cid);
    setSelection([]);
  }

  const result = calculateMeasurementResult(data.atoms, selection);
  // Stable key based on the selected indices (not the result object's identity,
  // which changes on every render) — result is a pure function of nguyenTu + the
  // selection, so this key is enough to detect exactly when the result actually changes.
  const resultKey = selection.join(",");

  useEffect(() => {
    onMeasurementChange?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultKey]);

  const onAtomClick = useCallback((i: number) => {
    setSelection((s) => addAtomSelection(s, i));
  }, []);

  const pointFor = (index: number) => {
    const nt = data.atoms[index];
    return new THREE.Vector3(nt.x, nt.y, nt.z);
  };

  return (
    <group>
      {data.atoms.map((nt, i) => (
        <SelectableAtom
          key={i}
          i={i}
          position={[nt.x, nt.y, nt.z]}
          radius={displayRadius(nt.atomicNumber)}
          selected={selection.includes(i)}
          hovering={hover === i}
          onHover={setHover}
          onAtomClick={onAtomClick}
        />
      ))}

      {result?.kind === "khoangCach" &&
        (() => {
          const A = pointFor(result.a);
          const B = pointFor(result.b);
          const mid = A.clone().add(B).multiplyScalar(0.5);
          return (
            <Html position={mid} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap rounded-full border border-washi/25 bg-sumi/85 px-2.5 py-1 font-mono text-[11px] text-washi backdrop-blur">
                {result.angstrom.toFixed(3)} Å
              </div>
            </Html>
          );
        })()}

      {result?.kind === "goc" &&
        (() => {
          const vertex = pointFor(result.b);
          return (
            <Html position={vertex} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap rounded-full border border-shu-sang/40 bg-sumi/85 px-2.5 py-1 font-mono text-[11px] text-shu-sang backdrop-blur">
                {result.degrees.toFixed(1)}°
              </div>
            </Html>
          );
        })()}
    </group>
  );
}
