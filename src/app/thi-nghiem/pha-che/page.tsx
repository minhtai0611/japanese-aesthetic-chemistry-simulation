import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import HienDan from "@/components/hien-dan";
import PhongPhaChe from "@/components/thi-nghiem/phong-pha-che";
import PhongKhac from "@/components/thi-nghiem/phong-khac";
import { layHopChat } from "@/lib/pubchem";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

const PHONG = CAC_PHONG[0];
const PHA_CHE_MAC_DINH = "NaOH";

export const metadata: Metadata = {
  title: `${PHONG.nhan} — phòng thí nghiệm ảo`,
  description:
    "Pha chế và pha loãng dung dịch với khối lượng mol thật từ PubChem: hòa tan chất rắn qua n = m/M hoặc pha loãng theo C₁V₁ = C₂V₂, có cốc thí nghiệm trực quan đổi màu theo nồng độ.",
  alternates: { canonical: "/thi-nghiem/pha-che" },
};

export default async function TrangPhaChe() {
  const hopChatBanDau = await layHopChat(PHA_CHE_MAC_DINH);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/thi-nghiem" className="gach-dong hover:text-washi">Thí nghiệm ảo</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{PHONG.nhan}</span>
      </nav>

      <HienDan className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="chi-muc mb-2 text-kin">Phòng I · {PHONG.kanji}</p>
            <h1 className="font-display text-3xl font-bold sm:text-5xl">{PHONG.nhan} dung dịch</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">{PHONG.moTa}</p>
          </div>
          <p className="font-mono text-xs text-washi-mo/70">{PHONG.congThuc}</p>
        </div>
      </HienDan>

      <div className="mt-10">
        <PhongPhaChe tenBanDau={PHA_CHE_MAC_DINH} hopChatBanDau={hopChatBanDau} />
      </div>

      <PhongKhac hienTai="pha-che" />
    </main>
  );
}
