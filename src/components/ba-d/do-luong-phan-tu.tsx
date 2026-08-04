"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { HopChat3D } from "@/lib/pubchem";
import {
  themLuaChonNguyenTu,
  tinhKetQuaDoLuong,
  type ChonNguyenTu,
  type KetQuaDoLuong,
} from "@/lib/hinh-hoc-do-luong";

/** Bán kính hiển thị nguyên tử — CÙNG công thức ad-hoc đã dùng ở mat-phan-tu.tsx
 * và phan-tu-2d.tsx (không đổi mat-phan-tu.tsx để giữ nguyên component đang
 * dùng chung với canh-hero.tsx — xem impact analysis trong plan). */
function banKinhHienThi(so: number): number {
  return so === 1 ? 0.31 : so >= 9 && so <= 17 ? 0.46 : 0.415;
}

const NGUONG_KEO_PX = 5;
const NGUONG_THOI_GIAN_MS = 400;

function NguyenTuChon({
  i,
  viTri,
  banKinh,
  daChon,
  dangHover,
  onHover,
  onClickThat,
}: {
  i: number;
  viTri: [number, number, number];
  banKinh: number;
  daChon: boolean;
  dangHover: boolean;
  onHover: (i: number | null) => void;
  onClickThat: (i: number) => void;
}) {
  const xuongLuc = useRef<{ x: number; y: number; t: number } | null>(null);
  useCursor(dangHover);

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    xuongLuc.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const luc = xuongLuc.current;
      xuongLuc.current = null;
      if (!luc) return;
      const dx = e.clientX - luc.x;
      const dy = e.clientY - luc.y;
      const diChuyen = Math.hypot(dx, dy);
      const thoiGian = performance.now() - luc.t;
      // Bấm-kéo-xoay (OrbitControls) không được tính là một lần chọn nguyên tử.
      if (diChuyen <= NGUONG_KEO_PX && thoiGian <= NGUONG_THOI_GIAN_MS) {
        onClickThat(i);
      }
    },
    [i, onClickThat],
  );

  return (
    <mesh
      position={viTri}
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
      <sphereGeometry args={[banKinh * 1.12, 16, 16]} />
      <meshBasicMaterial
        color={daChon ? "#ffffff" : "#ffffff"}
        wireframe
        transparent
        opacity={daChon ? 0.9 : dangHover ? 0.35 : 0}
        depthWrite={false}
      />
    </mesh>
  );
}

export function LopDoLuong({
  duLieu,
  onKetQuaDoLuongDoi,
}: {
  duLieu: HopChat3D;
  onKetQuaDoLuongDoi?: (k: KetQuaDoLuong) => void;
}) {
  const [daChon, setDaChon] = useState<ChonNguyenTu>([]);
  const [hover, setHover] = useState<number | null>(null);

  // Đổi phân tử (cid mới) → bắt đầu lại lựa chọn ngay trong render (mẫu hình
  // chính thức của React, giống soTruoc trong phong-chuyen-pha.tsx), tránh
  // chỉ số nguyên tử cũ trỏ sai sang dữ liệu phân tử mới.
  const [cidTruoc, setCidTruoc] = useState(duLieu.cid);
  if (duLieu.cid !== cidTruoc) {
    setCidTruoc(duLieu.cid);
    setDaChon([]);
  }

  const ketQua = tinhKetQuaDoLuong(duLieu.nguyenTu, daChon);
  // Khóa ổn định theo chỉ số đã chọn (không phải theo danh tính object ketQua,
  // vốn đổi mỗi lần render) — ketQua là hàm thuần của nguyenTu + daChon, nên
  // khóa này đủ để phát hiện đúng lúc kết quả thực sự đổi.
  const ketQuaKey = daChon.join(",");

  useEffect(() => {
    onKetQuaDoLuongDoi?.(ketQua);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ketQuaKey]);

  const onClickThat = useCallback((i: number) => {
    setDaChon((s) => themLuaChonNguyenTu(s, i));
  }, []);

  const diemNhan = (chiSo: number) => {
    const nt = duLieu.nguyenTu[chiSo];
    return new THREE.Vector3(nt.x, nt.y, nt.z);
  };

  return (
    <group>
      {duLieu.nguyenTu.map((nt, i) => (
        <NguyenTuChon
          key={i}
          i={i}
          viTri={[nt.x, nt.y, nt.z]}
          banKinh={banKinhHienThi(nt.so)}
          daChon={daChon.includes(i)}
          dangHover={hover === i}
          onHover={setHover}
          onClickThat={onClickThat}
        />
      ))}

      {ketQua?.loai === "khoangCach" &&
        (() => {
          const A = diemNhan(ketQua.a);
          const B = diemNhan(ketQua.b);
          const giua = A.clone().add(B).multiplyScalar(0.5);
          return (
            <Html position={giua} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap rounded-full border border-washi/25 bg-sumi/85 px-2.5 py-1 font-mono text-[11px] text-washi backdrop-blur">
                {ketQua.angstrom.toFixed(3)} Å
              </div>
            </Html>
          );
        })()}

      {ketQua?.loai === "goc" &&
        (() => {
          const dinh = diemNhan(ketQua.b);
          return (
            <Html position={dinh} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="whitespace-nowrap rounded-full border border-shu-sang/40 bg-sumi/85 px-2.5 py-1 font-mono text-[11px] text-shu-sang backdrop-blur">
                {ketQua.do.toFixed(1)}°
              </div>
            </Html>
          );
        })()}
    </group>
  );
}
