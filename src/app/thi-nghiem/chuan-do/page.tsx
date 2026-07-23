import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import HienDan from "@/components/hien-dan";
import PhongChuanDo from "@/components/thi-nghiem/phong-chuan-do";
import PhongKhac from "@/components/thi-nghiem/phong-khac";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

const PHONG = CAC_PHONG[1];

export const metadata: Metadata = {
  title: `${PHONG.nhan} — phòng thí nghiệm ảo`,
  description:
    "Chuẩn độ axit mạnh–bazơ mạnh: mở khóa burette, theo dõi phenolphtalein đổi màu và đường cong pH vẽ theo thời gian thực từ cân bằng mol H⁺/OH⁻ và K_w = 10⁻¹⁴.",
  alternates: { canonical: "/thi-nghiem/chuan-do" },
};

export default function TrangChuanDo() {
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
            <p className="chi-muc mb-2 text-kin">Phòng II · {PHONG.kanji}</p>
            <h1 className="font-display text-3xl font-bold sm:text-5xl">{PHONG.nhan}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">{PHONG.moTa}</p>
          </div>
          <p className="font-mono text-xs text-washi-mo/70">{PHONG.congThuc}</p>
        </div>
      </HienDan>

      <div className="mt-10">
        <PhongChuanDo />
      </div>

      <PhongKhac hienTai="chuan-do" />
    </main>
  );
}
