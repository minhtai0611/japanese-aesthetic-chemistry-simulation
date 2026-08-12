"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Compound3D } from "@/lib/pubchem";
import { COORD_SCALE_3D } from "@/lib/coordinate-scale-3d";
import { vanDerWaalsRadius } from "@/lib/vdw-radius";
import { colorFor, type ElementColor } from "./molecule-surface";

/**
 * Fresnel-glow shell simulating a Van der Waals surface — cheaper than
 * MeshPhysicalMaterial transmission (no extra render-target resample every
 * frame, matching the perf concern documented in docs/lighthouse.md) and
 * matches the visual convention of molecule viewers (Mol*, NGL, PyMOL): a
 * bright rim glow at the edge, transparent at the center — not occluding the
 * bonds inside.
 */
const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 vViewPos4 = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -vViewPos4.xyz;
    gl_Position = projectionMatrix * vViewPos4;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  uniform float fresnelPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), fresnelPower);
    gl_FragColor = vec4(color, fresnel * opacity);
  }
`;

const materialCache = new Map<string, THREE.ShaderMaterial>();

function vdwMaterialForColor(colorHex: string): THREE.ShaderMaterial {
  const existing = materialCache.get(colorHex);
  if (existing) return existing;
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      color: { value: new THREE.Color(colorHex) },
      opacity: { value: 0.55 },
      fresnelPower: { value: 2.2 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
  materialCache.set(colorHex, material);
  return material;
}

function VdwBall({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) {
  const material = useMemo(() => vdwMaterialForColor(color), [color]);
  return (
    <mesh position={position} renderOrder={10} material={material}>
      <sphereGeometry args={[radius, 24, 24]} />
    </mesh>
  );
}

export function VdwSurface({
  data,
  palette,
}: {
  data: Compound3D;
  palette: Map<number, ElementColor> | null;
}) {
  const balls = useMemo(
    () =>
      data.atoms
        .map((nt, i) => {
          const radiusA = vanDerWaalsRadius(nt.atomicNumber);
          if (radiusA === null) return null;
          return {
            i,
            position: [nt.x, nt.y, nt.z] as [number, number, number],
            radius: radiusA * COORD_SCALE_3D,
            color: colorFor(palette, nt.atomicNumber),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [data, palette],
  );

  return (
    <group>
      {balls.map((q) => (
        <VdwBall key={q.i} position={q.position} radius={q.radius} color={q.color} />
      ))}
    </group>
  );
}
