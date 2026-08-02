"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { HopChat3D } from "@/lib/pubchem";
import { TY_LE_TOA_DO_3D } from "@/lib/ty-le-toa-do-3d";
import { banKinhVanDerWaals } from "@/lib/ban-kinh-vdw";
import { mauCua, type MauNguyenTo } from "./mat-phan-tu";

/**
 * Vỏ Fresnel-glow mô phỏng bề mặt Van der Waals — rẻ hơn MeshPhysicalMaterial
 * transmission (không tốn thêm render-target resample mỗi khung hình, đúng
 * mối lo hiệu năng đã ghi trong docs/lighthouse.md) và đúng hình ảnh quy ước
 * của các trình xem phân tử (Mol*, NGL, PyMOL): viền sáng mờ ở rìa, trong
 * suốt ở tâm — không che khuất liên kết bên trong.
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
  uniform vec3 mauSac;
  uniform float doDam;
  uniform float congSuatFresnel;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 huongNhin = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(huongNhin, normalize(vNormal)), 0.0), congSuatFresnel);
    gl_FragColor = vec4(mauSac, fresnel * doDam);
  }
`;

const demVatLieu = new Map<string, THREE.ShaderMaterial>();

function vatLieuVdWTheoMau(mauHex: string): THREE.ShaderMaterial {
  const co = demVatLieu.get(mauHex);
  if (co) return co;
  const vl = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      mauSac: { value: new THREE.Color(mauHex) },
      doDam: { value: 0.55 },
      congSuatFresnel: { value: 2.2 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
  demVatLieu.set(mauHex, vl);
  return vl;
}

function QuaVdW({ viTri, banKinh, mau }: { viTri: [number, number, number]; banKinh: number; mau: string }) {
  const vatLieu = useMemo(() => vatLieuVdWTheoMau(mau), [mau]);
  return (
    <mesh position={viTri} renderOrder={10} material={vatLieu}>
      <sphereGeometry args={[banKinh, 24, 24]} />
    </mesh>
  );
}

export function BeMatVdW({
  duLieu,
  banMau,
}: {
  duLieu: HopChat3D;
  banMau: Map<number, MauNguyenTo> | null;
}) {
  const qua = useMemo(
    () =>
      duLieu.nguyenTu
        .map((nt, i) => {
          const banKinhA = banKinhVanDerWaals(nt.so);
          if (banKinhA === null) return null;
          return {
            i,
            viTri: [nt.x, nt.y, nt.z] as [number, number, number],
            banKinh: banKinhA * TY_LE_TOA_DO_3D,
            mau: mauCua(banMau, nt.so),
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    [duLieu, banMau],
  );

  return (
    <group>
      {qua.map((q) => (
        <QuaVdW key={q.i} viTri={q.viTri} banKinh={q.banKinh} mau={q.mau} />
      ))}
    </group>
  );
}
