"use client";

import { useEffect, useMemo, useState } from "react";
import "@react-three/fiber";
import * as THREE from "three";
import type { HopChat3D } from "@/lib/pubchem";

/* ----------------------------- Bản màu nguyên tố ----------------------------- */

export interface MauNguyenTo {
  mauCPK: string;
  kyHieu: string;
  tenVi: string;
}

const dem: { hua?: Promise<Map<number, MauNguyenTo>>; sanSang?: Map<number, MauNguyenTo> } = {};

/** Tải bảng màu CPK thật của 118 nguyên tố từ API nội bộ (đệm một lần toàn phiên) */
export function useBanMauNguyenTo(): Map<number, MauNguyenTo> | null {
  const [banMau, setBanMau] = useState<Map<number, MauNguyenTo> | null>(dem.sanSang ?? null);
  useEffect(() => {
    if (dem.sanSang) return;
    dem.hua ??= fetch("/api/danh-sach-nguyen-to")
      .then(async (r) => {
        if (!r.ok) return new Map<number, MauNguyenTo>();
        const mang = (await r.json()) as { so: number; mauCPK: string; kyHieu: string; tenVi: string }[];
        const m = new Map<number, MauNguyenTo>();
        for (const n of mang) m.set(n.so, { mauCPK: n.mauCPK, kyHieu: n.kyHieu, tenVi: n.tenVi });
        return m;
      })
      .catch(() => new Map<number, MauNguyenTo>());
    void dem.hua.then((m) => {
      dem.sanSang = m;
      setBanMau(m);
    });
  }, []);
  return banMau;
}

/* ------------------------------ Lưới lắp phân tử ------------------------------ */

const TRUC_Y = new THREE.Vector3(0, 1, 0);

interface KhucLienKet {
  tu: THREE.Vector3;
  den: THREE.Vector3;
  doDai: number;
  goc: THREE.Quaternion;
  giua: THREE.Vector3;
  mauA: string;
  mauB: string;
  banKinh: number;
  lech: THREE.Vector3 | null;
}

export function mauCua(banMau: Map<number, MauNguyenTo> | null, so: number): string {
  if (banMau?.get(so)?.mauCPK) return banMau.get(so)!.mauCPK;
  if (so === 1) return "#e8e2d4";
  return "#c9a35a";
}

export function MatPhanTu({
  duLieu,
  banMau,
  phatSang = 0.35,
}: {
  duLieu: HopChat3D;
  banMau: Map<number, MauNguyenTo> | null;
  phatSang?: number;
}) {
  const { nguyenTu, lienKet } = duLieu;

  const cacKhuc = useMemo<KhucLienKet[]>(() => {
    const ra: KhucLienKet[] = [];
    for (const lk of lienKet) {
      const A = nguyenTu[lk.a];
      const B = nguyenTu[lk.b];
      if (!A || !B) continue;
      const tu = new THREE.Vector3(A.x, A.y, A.z);
      const den = new THREE.Vector3(B.x, B.y, B.z);
      const huong = den.clone().sub(tu);
      const doDai = huong.length();
      if (doDai < 1e-4) continue;
      huong.normalize();
      const goc = new THREE.Quaternion().setFromUnitVectors(TRUC_Y, huong);
      const giua = tu.clone().add(den).multiplyScalar(0.5);
      const mauA = mauCua(banMau, A.so);
      const mauB = mauCua(banMau, B.so);

      if (lk.bac <= 1) {
        ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.085, lech: null });
      } else {
        let phu = new THREE.Vector3().crossVectors(huong, new THREE.Vector3(0, 0, 1));
        if (phu.lengthSq() < 1e-3) phu = new THREE.Vector3().crossVectors(huong, TRUC_Y);
        phu.normalize();
        const buoc = 0.105;
        if (lk.bac === 2) {
          ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.062, lech: phu.clone().multiplyScalar(buoc) });
          ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.062, lech: phu.clone().multiplyScalar(-buoc) });
        } else {
          ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.052, lech: null });
          ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.052, lech: phu.clone().multiplyScalar(buoc * 1.6) });
          ra.push({ tu, den, doDai, goc, giua, mauA, mauB, banKinh: 0.052, lech: phu.clone().multiplyScalar(-buoc * 1.6) });
        }
      }
    }
    return ra;
  }, [nguyenTu, lienKet, banMau]);

  const khungBanKinh = useMemo(() => {
    const m = new Map<number, number>();
    for (const nt of nguyenTu) {
      if (!m.has(nt.so)) {
        m.set(nt.so, nt.so === 1 ? 0.31 : nt.so >= 9 && nt.so <= 17 ? 0.46 : 0.415);
      }
    }
    return m;
  }, [nguyenTu]);

  return (
    <group>
      {nguyenTu.map((nt, i) => {
        const mau = mauCua(banMau, nt.so);
        return (
          <mesh key={`nt-${i}`} position={[nt.x, nt.y, nt.z]}>
            <sphereGeometry args={[khungBanKinh.get(nt.so) ?? 0.42, 20, 20]} />
            <meshStandardMaterial
              color={mau}
              emissive={mau}
              emissiveIntensity={phatSang}
              roughness={0.32}
              metalness={0.18}
            />
          </mesh>
        );
      })}
      {cacKhuc.map((lk, i) => {
        const tamA = lk.tu.clone().lerp(lk.giua, 0.5);
        const tamB = lk.giua.clone().lerp(lk.den, 0.5);
        const doDaiNua = lk.doDai / 2;
        const lech = lk.lech ?? new THREE.Vector3();
        return (
          <group key={`lk-${i}`}>
            <mesh
              position={tamA.clone().add(lech)}
              quaternion={lk.goc}
            >
              <cylinderGeometry args={[lk.banKinh, lk.banKinh, doDaiNua, 12, 1]} />
              <meshStandardMaterial color={lk.mauA} roughness={0.4} metalness={0.15} />
            </mesh>
            <mesh position={tamB.clone().add(lech)} quaternion={lk.goc}>
              <cylinderGeometry args={[lk.banKinh, lk.banKinh, doDaiNua, 12, 1]} />
              <meshStandardMaterial color={lk.mauB} roughness={0.4} metalness={0.15} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function banKinhBaoQuanh(duLieu: HopChat3D | null): number {
  if (!duLieu || duLieu.nguyenTu.length === 0) return 1.6;
  let m = 0;
  for (const nt of duLieu.nguyenTu) m = Math.max(m, Math.hypot(nt.x, nt.y, nt.z));
  return Math.max(m + 0.7, 1.4);
}

export { TRUC_Y };
