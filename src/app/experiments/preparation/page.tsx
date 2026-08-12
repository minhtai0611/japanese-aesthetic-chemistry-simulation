import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import FadeIn from "@/components/fade-in";
import PreparationLab from "@/components/experiments/preparation-lab";
import MiscLab from "@/components/experiments/misc-lab";
import { fetchCompound } from "@/lib/pubchem";
import { LABS } from "@/lib/laboratory";

const LAB = LABS[0];
const DEFAULT_COMPOUND = "NaOH";

export const metadata: Metadata = {
  title: `${LAB.label} — phòng thí nghiệm ảo`,
  description:
    "Pha chế và pha loãng dung dịch với khối lượng mol thật từ PubChem: hòa tan chất rắn qua n = m/M hoặc pha loãng theo C₁V₁ = C₂V₂, có cốc thí nghiệm trực quan đổi màu theo nồng độ.",
  alternates: { canonical: "/experiments/preparation" },
};

export default async function PreparationPage() {
  const initialCompound = await fetchCompound(DEFAULT_COMPOUND);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/experiments" className="gach-dong hover:text-washi">Thí nghiệm ảo</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{LAB.label}</span>
      </nav>

      <FadeIn className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="chi-muc mb-2 text-kin">Phòng I · {LAB.kanji}</p>
            <h1 className="font-display text-3xl font-bold sm:text-5xl">{LAB.label} dung dịch</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">{LAB.description}</p>
          </div>
          <p className="font-mono text-xs text-washi-mo/70">{LAB.formula}</p>
        </div>
      </FadeIn>

      <div className="mt-10">
        <PreparationLab initialName={DEFAULT_COMPOUND} initialCompound={initialCompound} />
      </div>

      <MiscLab current="preparation" />
    </main>
  );
}
