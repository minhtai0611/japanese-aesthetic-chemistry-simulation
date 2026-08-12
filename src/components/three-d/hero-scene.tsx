"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { MoleculeSurface, boundingRadius, useElementColorMap } from "./molecule-surface";
import type { Compound3D } from "@/lib/pubchem";
import { usePrefersReducedMotion } from "@/lib/use-motion";

// Split off from the main chunk — see the explanation at the top of post-processing-effects.tsx.
const HeroPostEffectsLazy = dynamic(() => import("./post-processing-effects").then((m) => m.HeroPostEffects), { ssr: false });

/** Deterministic (pure) hash function replacing Math.random — same seed always gives the same result */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ------------------------------ Ambient dust ------------------------------ */
function DustMotes() {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5.5 + pseudoRandom(i * 3) * 7;
      const theta = pseudoRandom(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * pseudoRandom(i * 3 + 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((st, dt) => {
    if (pointsRef.current) pointsRef.current.rotation.y -= dt * 0.018;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#c9a35a"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------ Fire ensō ring ------------------------------- */
function EnsoRing() {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.rotation.z = t * 0.07;
    const s = 1 + Math.sin(t * 0.5) * 0.008;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref} rotation={[0.35, 0.15, 0]}>
      <mesh>
        <torusGeometry args={[3.05, 0.028, 24, 160]} />
        <meshStandardMaterial
          color="#5c1408"
          emissive="#ff4a26"
          emissiveIntensity={2.4}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, 0.6, 0]}>
        <torusGeometry args={[3.65, 0.011, 16, 140]} />
        <meshStandardMaterial
          color="#3a2c12"
          emissive="#c9a35a"
          emissiveIntensity={0.9}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* --------------------------- Living benzene molecule ---------------------------- */
function HeroMolecule() {
  const palette = useElementColorMap();
  const [molecule, setMolecule] = useState<Compound3D | null>(null);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/compound/benzene/3d")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d?.atoms?.length && setMolecule(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useFrame((st, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.22;
  });

  return (
    <group ref={ref}>
      {molecule ? (
        <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.85}>
          <MoleculeSurface data={molecule} palette={palette} glowIntensity={0.5} />
        </Float>
      ) : (
        <mesh>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#c9a35a" emissive="#c9a35a" emissiveIntensity={0.5} wireframe />
        </mesh>
      )}
    </group>
  );
}

/**
 * three.js's WebGLRenderer.dispose() does not release the GPU-side context —
 * only forceContextLoss() does. Next.js unmounts this Canvas on navigation
 * away from "/", so without this, rapid navigation can leak contexts toward
 * the browser's ~16-context cap ("THREE.WebGLRenderer: Context Lost.").
 */
function ReleaseGLContext() {
  const { gl } = useThree();
  useEffect(() => {
    return () => gl.forceContextLoss();
  }, [gl]);
  return null;
}

/* ------------------------------- Mouse-follow camera ---------------------------- */
function CameraDrift() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    target.set(pointer.x * 0.9, 0.4 + pointer.y * 0.6, 8.4);
    camera.position.lerp(target, 0.045);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const reducedMotion = usePrefersReducedMotion();
  // Wait for the main scene to draw its first frame before loading the postprocessing
  // chunk — avoids the Bloom/Vignette bundle competing for the main thread right at page load.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const idle = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 300);
    const cancelIdle = typeof requestIdleCallback === "function" ? cancelIdleCallback : clearTimeout;
    const id = idle(() => setReady(true));
    return () => cancelIdle(id as never);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden>
      <Canvas
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0.4, 8.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#0b0a08", 9, 17]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 4]} intensity={1.4} color="#fff4e0" />
        <pointLight position={[-6, -3, 2]} intensity={12} color="#d63b1f" distance={16} />
        <Suspense fallback={null}>
          <DustMotes />
          <EnsoRing />
          <HeroMolecule />
        </Suspense>
        <CameraDrift />
        <ReleaseGLContext />
        {!reducedMotion && ready && <HeroPostEffectsLazy />}
      </Canvas>
    </div>
  );
}
