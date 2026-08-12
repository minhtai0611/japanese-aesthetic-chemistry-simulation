import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import FadeIn from "@/components/fade-in";
import PhaseChangeLab from "@/components/experiments/phase-change-lab";
import MiscLab from "@/components/experiments/misc-lab";
import { fetchAllElements } from "@/lib/pubchem";
import { LABS } from "@/lib/laboratory";

const LAB = LABS[2];

export const metadata: Metadata = {
  title: `${LAB.label} — phòng thí nghiệm ảo`,
  description:
    "Kéo nhiệt độ qua mốc nóng chảy và điểm sôi thật của từng nguyên tố (dữ liệu PubChem) để xem vật chất chuyển từ rắn sang lỏng rồi sang khí, mô phỏng bằng hệ hạt trực quan.",
  alternates: { canonical: "/experiments/phase-change" },
};

export default async function PhaseChangePage() {
  const elements = await fetchAllElements();

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
            <p className="chi-muc mb-2 text-kin">Phòng III · {LAB.kanji}</p>
            <h1 className="font-display text-3xl font-bold sm:text-5xl">{LAB.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">{LAB.description}</p>
          </div>
          <p className="font-mono text-xs text-washi-mo/70">{LAB.formula}</p>
        </div>
      </FadeIn>

      <div className="mt-10">
        {elements.length > 0 ? (
          <PhaseChangeLab elements={elements} />
        ) : (
          <p className="the-khac rounded-2xl p-6 text-sm text-washi-mo">
            Đang chờ PubChem đáp lễ — tải lại trang sau vài giây.
          </p>
        )}
      </div>

      <MiscLab current="phase-change" />
    </main>
  );
}
