"use client";

import dynamic from "next/dynamic";

const CanhHero = dynamic(() => import("@/components/ba-d/canh-hero"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="h-64 w-64 animate-hoi-tho rounded-full border border-shu/30" />
    </div>
  ),
});

export default function HeroNen() {
  return <CanhHero />;
}
