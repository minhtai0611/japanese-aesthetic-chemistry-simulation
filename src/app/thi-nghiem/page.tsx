import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Droplets, FlaskConical, Scale, Thermometer, Zap } from "lucide-react";
import HienDan from "@/components/hien-dan";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm ảo — Chuẩn độ, pha loãng, chuyển pha, cân bằng, điện hóa",
  description:
    "Năm phòng thí nghiệm ảo tương tác bằng tiếng Việt: pha chế & pha loãng dung dịch với khối lượng mol thật, chuẩn độ axit–bazơ vẽ đường cong pH thời gian thực, buồng chuyển pha quanh điểm nóng chảy–điểm sôi thực nghiệm từ PubChem, cân bằng phương trình bằng đại số tuyến tính, và pin điện hóa Galvanic qua phương trình Nernst.",
  alternates: { canonical: "/thi-nghiem" },
};

const ICON = {
  "pha-che": Droplets,
  "chuan-do": FlaskConical,
  "chuyen-pha": Thermometer,
  "can-bang": Scale,
  "pin-dien-hoa": Zap,
} as const;

export default function TrangThiNghiem() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">実験室 — Virtual Laboratory</p>
        <h1 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
          Năm phòng <em className="text-shu-sang">thí nghiệm</em>, một niềm tin khoa học
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-washi-mo">
          Mỗi mô phỏng dưới đây được xây trên hai cột trụ: <strong className="text-washi">số liệu thật</strong> từ
          PubChem và <strong className="text-washi">phương trình thật</strong> của hóa học đại cương.
          Không hình minh họa đóng vai kết quả — chỉ có toán học đang thở.
        </p>
      </HienDan>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAC_PHONG.map((p, i) => {
          const Icon = ICON[p.slug];
          return (
            <HienDan key={p.slug} tre={i * 0.08}>
              <Link
                href={`/thi-nghiem/${p.slug}`}
                className="the-khac group relative block h-full overflow-hidden rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1.5"
              >
                <span className="pointer-events-none absolute -right-3 -top-6 select-none font-display text-[7rem] font-black leading-none text-washi/[0.045] transition-colors duration-500 group-hover:text-shu/15">
                  {p.kanji}
                </span>
                <span className="inline-flex rounded-2xl border border-shu/35 bg-shu/10 p-3 text-shu-sang">
                  <Icon size={20} />
                </span>
                <p className="mt-5 chi-muc text-kin">Phòng {i + 1} · {p.kanji}</p>
                <h2 className="mt-2 font-display text-xl font-bold">{p.nhan}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-washi-mo">{p.moTa}</p>
                <p className="mt-3 font-mono text-[10px] text-washi-mo/70">{p.congThuc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-kin">
                  Vào phòng <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </HienDan>
          );
        })}
      </div>
    </main>
  );
}
