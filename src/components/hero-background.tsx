"use client";

import dynamic from "next/dynamic";
import { useDataSaverMode } from "@/components/data-saver-mode";
import { LazyCanvasWrapper } from "@/components/three-d/lazy-canvas-wrapper";

const HeroScene = dynamic(() => import("@/components/three-d/hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="h-64 w-64 animate-hoi-tho rounded-full border border-shu/30" />
    </div>
  ),
});

export default function HeroBackground() {
  const [dataSaver] = useDataSaverMode();
  // Data saver mode: skip loading the hero scene's whole three.js chunk —
  // a meaningful cut in executed JS on weak devices/slow networks, replaced
  // by a lightweight static background instead.
  // Even when data saver is OFF: the 3D canvas only loads once this element
  // enters the viewport (LazyCanvasWrapper/IntersectionObserver) — the hero
  // is always at the top of the page so it fires almost immediately, but
  // this still moves three.js loading/initialization out of the initial
  // render flow, avoiding blocking LCP/TBT.
  return (
    <LazyCanvasWrapper
      disable3D={dataSaver}
      render2D={() => (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2a1810_0%,#0b0a08_75%)]"
        />
      )}
      render3D={() => <HeroScene />}
    />
  );
}
