"use client";

import dynamic from "next/dynamic";
import { useCheDoTietKiem } from "@/components/che-do-tiet-kiem";
import { LazyCanvasWrapper } from "@/components/ba-d/lazy-canvas-wrapper";

const CanhHero = dynamic(() => import("@/components/ba-d/canh-hero"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="h-64 w-64 animate-hoi-tho rounded-full border border-shu/30" />
    </div>
  ),
});

export default function HeroNen() {
  const [tietKiem] = useCheDoTietKiem();
  // Chế độ tiết kiệm: không tải cả chunk three.js của cảnh hero — tiết kiệm
  // đáng kể JS thực thi trên máy yếu/mạng chậm, thay bằng nền tĩnh nhẹ.
  // Ngay cả khi KHÔNG tiết kiệm: Canvas 3D chỉ tải khi phần tử này lọt khung
  // nhìn (LazyCanvasWrapper/IntersectionObserver) — hero luôn ở đầu trang nên
  // sẽ kích hoạt gần như ngay, nhưng việc này vẫn dời tải/khởi tạo three.js
  // ra khỏi luồng render lần đầu, tránh chặn LCP/TBT.
  return (
    <LazyCanvasWrapper
      bat2D={tietKiem}
      render2D={() => (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2a1810_0%,#0b0a08_75%)]"
        />
      )}
      render3D={() => <CanhHero />}
    />
  );
}
