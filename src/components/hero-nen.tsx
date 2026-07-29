"use client";

import dynamic from "next/dynamic";
import { useCheDoTietKiem } from "@/components/che-do-tiet-kiem";

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
  if (tietKiem) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2a1810_0%,#0b0a08_75%)]"
      />
    );
  }
  return <CanhHero />;
}
