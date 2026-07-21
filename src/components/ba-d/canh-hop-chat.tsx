"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { MatPhanTu, banKinhBaoQuanh, useBanMauNguyenTo } from "./mat-phan-tu";
import type { HopChat3D } from "@/lib/pubchem";

function TrucXoay({ duLieu, tuXoay, banMau }: {
  duLieu: HopChat3D;
  tuXoay: boolean;
  banMau: ReturnType<typeof useBanMauNguyenTo>;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, dt) => {
    if (tuXoay && ref.current) ref.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={ref}>
      <MatPhanTu duLieu={duLieu} banMau={banMau} phatSang={0.42} />
    </group>
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
  const banKinh = useMemo(() => banKinhBaoQuanh(duLieu), [duLieu]);
  const khoangCach = Math.min(Math.max(banKinh * 2.5, 4.5), 26);

  return (
    <div className="absolute inset-0 mo-dan" key={duLieu.cid}>
      <Canvas
        camera={{ position: [0, banKinh * 0.35, khoangCach], fov: 44 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 8, 5]} intensity={1.5} color="#fff3e2" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#7fa0d8" />
        <pointLight position={[0, -4, 4]} intensity={10} color="#d63b1f" distance={20} />
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
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={khoangCach * 0.45}
          maxDistance={khoangCach * 2.2}
        />
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.24} luminanceSmoothing={0.4} radius={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
