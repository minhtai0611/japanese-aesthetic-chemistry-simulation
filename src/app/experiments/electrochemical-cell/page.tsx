import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import FadeIn from "@/components/fade-in";
import ElectrochemicalCellLab from "@/components/experiments/electrochemical-cell-lab";
import MiscLab from "@/components/experiments/misc-lab";
import { LABS } from "@/lib/laboratory";

const LAB = LABS[4];

export const metadata: Metadata = {
  title: `${LAB.label} — phòng thí nghiệm ảo`,
  description:
    "Pin điện hóa Galvanic: chọn hai điện cực kim loại, tra thế điện cực chuẩn đã ghim (CRC Handbook of Chemistry and Physics), tính điện thế pin thật qua phương trình Nernst theo nồng độ ion, và suy ra ΔG° của phản ứng oxi hóa-khử.",
  alternates: { canonical: "/experiments/electrochemical-cell" },
};

export default function ElectrochemicalCellPage() {
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
            <p className="chi-muc mb-2 text-kin">Phòng V · {LAB.kanji}</p>
            <h1 className="font-display text-3xl font-bold sm:text-5xl">{LAB.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">{LAB.description}</p>
          </div>
          <p className="font-mono text-xs text-washi-mo/70">{LAB.formula}</p>
        </div>
      </FadeIn>

      <div className="mt-10">
        <ElectrochemicalCellLab />
      </div>

      <MiscLab current="electrochemical-cell" />
    </main>
  );
}
