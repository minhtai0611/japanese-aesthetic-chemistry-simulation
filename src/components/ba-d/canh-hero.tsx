"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { MatPhanTu, banKinhBaoQuanh, useBanMauNguyenTo } from "./mat-phan-tu";
import type { HopChat3D } from "@/lib/pubchem";
import { useGiamChuyenDong } from "@/lib/dung-chuyen-dong";

/** Hàm băm quyết định (pure) thay Math.random — cùng seed luôn cho cùng kết quả */
function ngauNhienGia(hat: number): number {
  const x = Math.sin(hat * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ------------------------------ Bụi phòng chìm ------------------------------ */
function DamBui() {
  const thamChieu = useRef<THREE.Points>(null);
  const hinhHoc = useMemo(() => {
    const so = 520;
    const mang = new Float32Array(so * 3);
    for (let i = 0; i < so; i++) {
      const r = 5.5 + ngauNhienGia(i * 3) * 7;
      const theta = ngauNhienGia(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * ngauNhienGia(i * 3 + 2) - 1);
      mang[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      mang[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      mang[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(mang, 3));
    return g;
  }, []);

  useFrame((st, dt) => {
    if (thamChieu.current) thamChieu.current.rotation.y -= dt * 0.018;
  });

  return (
    <points ref={thamChieu} geometry={hinhHoc}>
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

/* ------------------------------ Vòng ensō lửa ------------------------------- */
function VongEnso() {
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

/* --------------------------- Phân tử benzene sống ---------------------------- */
function PhanTuHero() {
  const banMau = useBanMauNguyenTo();
  const [duLieu, setDuLieu] = useState<HopChat3D | null>(null);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    let dangSong = true;
    fetch("/api/hop-chat/benzene/3d")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => dangSong && d?.nguyenTu?.length && setDuLieu(d))
      .catch(() => undefined);
    return () => {
      dangSong = false;
    };
  }, []);

  useFrame((st, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.22;
  });

  return (
    <group ref={ref}>
      {duLieu ? (
        <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.85}>
          <MatPhanTu duLieu={duLieu} banMau={banMau} phatSang={0.5} />
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
function GiaiPhongContext() {
  const { gl } = useThree();
  useEffect(() => {
    return () => gl.forceContextLoss();
  }, [gl]);
  return null;
}

/* ------------------------------- Camera theo chuột ---------------------------- */
function CameraRu() {
  const { camera, pointer } = useThree();
  const mucTieu = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    mucTieu.set(pointer.x * 0.9, 0.4 + pointer.y * 0.6, 8.4);
    camera.position.lerp(mucTieu, 0.045);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function CanhHero() {
  const giam = useGiamChuyenDong();

  return (
    <div className="absolute inset-0" aria-hidden>
      <Canvas
        frameloop={giam ? "demand" : "always"}
        camera={{ position: [0, 0.4, 8.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={["#0b0a08", 9, 17]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 4]} intensity={1.4} color="#fff4e0" />
        <pointLight position={[-6, -3, 2]} intensity={12} color="#d63b1f" distance={16} />
        <Suspense fallback={null}>
          <DamBui />
          <VongEnso />
          <PhanTuHero />
        </Suspense>
        <CameraRu />
        <GiaiPhongContext />
        {!giam && (
          <EffectComposer>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.34} radius={0.75} />
            <Vignette eskil={false} offset={0.24} darkness={0.72} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
