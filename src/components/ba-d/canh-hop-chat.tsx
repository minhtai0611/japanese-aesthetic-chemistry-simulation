"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import dynamic from "next/dynamic";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { MatPhanTu, banKinhBaoQuanh, useBanMauNguyenTo } from "./mat-phan-tu";
import type { HopChat3D } from "@/lib/pubchem";

// Tách riêng khỏi chunk chính — xem giải thích ở đầu hieu-ung-hau-xu-ly.tsx.
const HieuUngHopChat = dynamic(() => import("./hieu-ung-hau-xu-ly").then((m) => m.HieuUngHopChat), { ssr: false });

/**
 * three.js's WebGLRenderer.dispose() does not release the GPU-side context —
 * only forceContextLoss() does. Without this, unmounting CanhHopChat (e.g.
 * navigating away, or a failed lookup clearing the compound) would leak the
 * context until GC, risking the browser's ~16-context cap on repeated visits.
 */
function GiaiPhongContext() {
  const { gl } = useThree();
  useEffect(() => {
    return () => gl.forceContextLoss();
  }, [gl]);
  return null;
}

function TrucXoay({ duLieu, tuXoay, banMau }: {
  duLieu: HopChat3D;
  tuXoay: boolean;
  banMau: ReturnType<typeof useBanMauNguyenTo>;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, dt) => {
    if (tuXoay && ref.current) ref.current.rotation.y += dt * 0.3;
  });
  // Molecule đổi (cid mới) — bắt đầu lại từ góc quay 0 thay vì kế thừa góc cũ.
  useEffect(() => {
    if (ref.current) ref.current.rotation.y = 0;
  }, [duLieu.cid]);
  return (
    <group ref={ref}>
      <MatPhanTu duLieu={duLieu} banMau={banMau} phatSang={0.42} />
    </group>
  );
}

/**
 * Canvas được giữ nguyên (không remount) khi đổi hợp chất — camera/OrbitControls
 * không tự biết phải "lấy khung hình lại" cho phân tử mới, nên phải tự tay
 * đặt lại vị trí camera + mục tiêu điều khiển mỗi khi cid đổi.
 */
function DongBoKhungHinh({
  cid,
  banKinh,
  khoangCach,
}: {
  cid: number | string;
  banKinh: number;
  khoangCach: number;
}) {
  const { camera } = useThree();
  const dieuKhien = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    camera.position.set(0, banKinh * 0.35, khoangCach);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
    dieuKhien.current?.target.set(0, 0, 0);
    dieuKhien.current?.update();
    // Chỉ đặt lại khung hình khi phân tử thực sự đổi (cid mới), không phải mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  return (
    <OrbitControls
      ref={dieuKhien}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={khoangCach * 0.45}
      maxDistance={khoangCach * 2.2}
    />
  );
}

export default function CanhHopChat({
  duLieu,
  tuXoay = true,
}: {
  duLieu: HopChat3D;
  tuXoay?: boolean;
}) {
  const banMau = useBanMauNguyenTo();
  // Đợi scene chính vẽ xong khung hình đầu rồi mới tải chunk postprocessing —
  // tránh việc bundle Bloom cạnh tranh main-thread ngay lúc tải trang.
  const [daSanSang, setDaSanSang] = useState(false);
  useEffect(() => {
    const idle = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 300);
    const huy = typeof requestIdleCallback === "function" ? cancelIdleCallback : clearTimeout;
    const id = idle(() => setDaSanSang(true));
    return () => huy(id as never);
  }, []);
  const banKinh = useMemo(() => banKinhBaoQuanh(duLieu), [duLieu]);
  const khoangCach = Math.min(Math.max(banKinh * 2.5, 4.5), 26);
  // Vị trí camera ban đầu (Canvas chỉ mount MỘT LẦN) — các lần đổi phân tử sau đó
  // do DongBoKhungHinh tự cập nhật lại, không cần Canvas remount.
  const camBanDau = useMemo(
    () => ({ position: [0, banKinh * 0.35, khoangCach] as [number, number, number], fov: 44 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="absolute inset-0 mo-dan">
      {/* frameloop="demand" khi không tự xoay: dừng vòng lặp render liên tục
          (tôn trọng prefers-reduced-motion mặc định qua trinh-pham-3d.tsx).
          OrbitControls (drei) tự gọi invalidate() khi người dùng kéo/thả, nên
          vẫn tương tác được bình thường ở chế độ demand — chỉ mất phần
          TỰ xoay khi không ai chạm vào. */}
      <Canvas
        frameloop={tuXoay ? "always" : "demand"}
        camera={camBanDau}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 5]} intensity={1.5} color="#fff3e2" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#7fa0d8" />
        <pointLight position={[0, -4, 4]} intensity={10} color="#d63b1f" distance={20} />
        <GiaiPhongContext />
        <Suspense fallback={null}>
          <TrucXoay duLieu={duLieu} tuXoay={tuXoay} banMau={banMau} />
          {/* vòng đài */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -banKinh - 0.15, 0]}>
            <ringGeometry args={[banKinh * 0.9, banKinh * 0.92, 96]} />
            <meshBasicMaterial color="#d63b1f" transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -banKinh - 0.15, 0]}>
            <circleGeometry args={[banKinh * 1.35, 64]} />
            <meshBasicMaterial color="#f2ead9" transparent opacity={0.03} />
          </mesh>
        </Suspense>
        <DongBoKhungHinh cid={duLieu.cid} banKinh={banKinh} khoangCach={khoangCach} />
        {daSanSang && <HieuUngHopChat />}
      </Canvas>
      {/* Phủ mờ dần mỗi lần đổi phân tử — chỉ là div thường, không phải WebGL, nên remount vô hại */}
      <div key={duLieu.cid} className="pointer-events-none absolute inset-0 bg-sumi mo-dan-nguoc" />
    </div>
  );
}
