"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import dynamic from "next/dynamic";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { MoleculeSurface, boundingRadius, useElementColorMap } from "./molecule-surface";
import type { Compound3D } from "@/lib/pubchem";
import type { MeasurementResult } from "@/lib/measurement-geometry";

// Split off from the main chunk — see the explanation at the top of post-processing-effects.tsx.
const CompoundPostEffectsLazy = dynamic(() => import("./post-processing-effects").then((m) => m.CompoundPostEffects), { ssr: false });
// VDW surface + measurement tool — only loaded when the user actively enables it (enhancedEnabled),
// does NOT affect the default chunk weight of the 3D stage.
const VdwSurfaceLazy = dynamic(() => import("./vdw-surface").then((m) => m.VdwSurface), { ssr: false });
const MeasurementLayer = dynamic(() => import("./molecule-measurement").then((m) => m.MeasurementLayer), { ssr: false });

/**
 * three.js's WebGLRenderer.dispose() does not release the GPU-side context —
 * only forceContextLoss() does. Without this, unmounting CompoundScene (e.g.
 * navigating away, or a failed lookup clearing the compound) would leak the
 * context until GC, risking the browser's ~16-context cap on repeated visits.
 */
function ReleaseGLContext() {
  const { gl } = useThree();
  useEffect(() => {
    return () => gl.forceContextLoss();
  }, [gl]);
  return null;
}

function RotatingGroup({ data, autoRotate, palette, enhancedEnabled, ready, onMeasurementChange }: {
  data: Compound3D;
  autoRotate: boolean;
  palette: ReturnType<typeof useElementColorMap>;
  enhancedEnabled: boolean;
  ready: boolean;
  onMeasurementChange?: (k: MeasurementResult) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, dt) => {
    if (autoRotate && ref.current) ref.current.rotation.y += dt * 0.3;
  });
  // Molecule changed (new cid) — restart from rotation angle 0 instead of inheriting the old angle.
  useEffect(() => {
    if (ref.current) ref.current.rotation.y = 0;
  }, [data.cid]);
  return (
    <group ref={ref}>
      <MoleculeSurface data={data} palette={palette} glowIntensity={0.42} />
      {/* Same rotating group as the atoms/bonds — the VDW shell and measurement
          pick points must rotate along with it, not stay static when autoRotate is on. */}
      {enhancedEnabled && ready && <VdwSurfaceLazy data={data} palette={palette} />}
      {enhancedEnabled && ready && (
        <MeasurementLayer data={data} onMeasurementChange={onMeasurementChange} />
      )}
    </group>
  );
}

/**
 * The Canvas is kept as-is (not remounted) when the compound changes — the
 * camera/OrbitControls don't automatically know to "reframe" for the new
 * molecule, so the camera position + controls target must be reset by hand
 * every time the cid changes.
 */
function SyncCameraFraming({
  cid,
  radius,
  distance,
}: {
  cid: number | string;
  radius: number;
  distance: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    camera.position.set(0, radius * 0.35, distance);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
    // Only reframe when the molecule actually changes (new cid), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={distance * 0.45}
      maxDistance={distance * 2.2}
    />
  );
}

export default function CompoundScene({
  data,
  autoRotate = true,
  enhancedEnabled = false,
  onMeasurementChange,
}: {
  data: Compound3D;
  autoRotate?: boolean;
  /** Enables the VDW shell + distance/angle measurement tool — off by default (progressive enhancement). */
  enhancedEnabled?: boolean;
  onMeasurementChange?: (k: MeasurementResult) => void;
}) {
  const palette = useElementColorMap();
  // Wait for the main scene to draw its first frame before loading the postprocessing
  // chunk — avoids the Bloom bundle competing for the main thread right at page load.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const idle = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 300);
    const cancelIdle = typeof requestIdleCallback === "function" ? cancelIdleCallback : clearTimeout;
    const id = idle(() => setReady(true));
    return () => cancelIdle(id as never);
  }, []);
  const radius = useMemo(() => boundingRadius(data), [data]);
  const distance = Math.min(Math.max(radius * 2.5, 4.5), 26);
  // Initial camera position (the Canvas mounts only ONCE) — subsequent molecule
  // changes are updated by SyncCameraFraming instead, no Canvas remount needed.
  const initialCamera = useMemo(
    () => ({ position: [0, radius * 0.35, distance] as [number, number, number], fov: 44 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="absolute inset-0 mo-dan">
      {/* frameloop="demand" when not auto-rotating: stops the continuous render loop
          (respects prefers-reduced-motion by default via trinh-pham-3d.tsx).
          OrbitControls (drei) calls invalidate() itself when the user drags/releases, so
          it's still fully interactive in demand mode — only the AUTO rotation is lost
          when no one is touching it. */}
      <Canvas
        frameloop={autoRotate ? "always" : "demand"}
        camera={initialCamera}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 5]} intensity={1.5} color="#fff3e2" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#7fa0d8" />
        <pointLight position={[0, -4, 4]} intensity={10} color="#d63b1f" distance={20} />
        <ReleaseGLContext />
        <Suspense fallback={null}>
          <RotatingGroup
            data={data}
            autoRotate={autoRotate}
            palette={palette}
            enhancedEnabled={enhancedEnabled}
            ready={ready}
            onMeasurementChange={onMeasurementChange}
          />
          {/* stage ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius - 0.15, 0]}>
            <ringGeometry args={[radius * 0.9, radius * 0.92, 96]} />
            <meshBasicMaterial color="#d63b1f" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius - 0.15, 0]}>
            <circleGeometry args={[radius * 1.35, 64]} />
            <meshBasicMaterial color="#f2ead9" transparent opacity={0.03} />
          </mesh>
        </Suspense>
        <SyncCameraFraming cid={data.cid} radius={radius} distance={distance} />
        {ready && <CompoundPostEffectsLazy />}
      </Canvas>
      {/* Fade overlay on every molecule change — just a plain div, not WebGL, so remounting is harmless */}
      <div key={data.cid} className="pointer-events-none absolute inset-0 bg-sumi mo-dan-nguoc" />
    </div>
  );
}
