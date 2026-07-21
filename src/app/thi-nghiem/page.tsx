import type { Metadata } from "next";
import Link from "next/link";
import { Droplets, FlaskConical, Thermometer } from "lucide-react";
import HienDan from "@/components/hien-dan";
import PhongPhaChe from "@/components/thi-nghiem/phong-pha-che";
import PhongChuanDo from "@/components/thi-nghiem/phong-chuan-do";
import PhongChuyenPha from "@/components/thi-nghiem/phong-chuyen-pha";
import { layTatCaNguyenTo } from "@/lib/pubchem";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm ảo — Chuẩn độ, pha loãng, chuyển pha",
  description:
    "Ba phòng thí nghiệm ảo tương tác bằng tiếng Việt: pha chế & pha loãng dung dịch với khối lượng mol thật, chuẩn độ axit–bazơ vẽ đường cong pH thời gian thực, và buồng chuyển pha quanh điểm nóng chảy–điểm sôi thực nghiệm từ PubChem.",
  alternates: { canonical: "/thi-nghiem" },
};

const MUC_LUC = [
  { neo: "pha-che", kanji: "希釈", icon: Droplets, nhan: "Pha chế & pha loãng" },
  { neo: "chuan-do", kanji: "滴定", icon: FlaskConical, nhan: "Chuẩn độ axit–bazơ" },
  { neo: "chuyen-pha", kanji: "相転移", icon: Thermometer, nhan: "Buồng chuyển pha" },
];

export default async function TrangThiNghiem() {
  const nguyenTo = await layTatCaNguyenTo();

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">実験室 — Virtual Laboratory</p>
        <h1 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
          Ba phòng <em className="text-shu-sang">thí nghiệm</em>, một niềm tin khoa học
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-washi-mo">
          Mỗi mô phỏng dưới đây được xây trên hai cột trụ: <strong className="text-washi">số liệu thật</strong> từ
          PubChem và <strong className="text-washi">phương trình thật</strong> của hóa học đại cương.
          Không hình minh họa đóng vai kết quả — chỉ có toán học đang thở.
        </p>
      </HienDan>

      {/* Mục lục phòng */}
      <HienDan tre={0.1} className="sticky top-[64px] z-40 mt-10">
        <div className="the-khac flex flex-wrap gap-2 rounded-2xl bg-sumi/85 p-2 backdrop-blur-md">
          {MUC_LUC.map((m) => (
            <Link
              key={m.neo}
              href={`#${m.neo}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-washi-mo transition-colors hover:bg-shu/15 hover:text-washi"
            >
              <m.icon size={15} className="text-shu-sang" />
              <span className="hidden font-mono text-[10px] text-kin sm:inline">{m.kanji}</span>
              {m.nhan}
            </Link>
          ))}
        </div>
      </HienDan>

      {/* PHÒNG 1 — PHA CHẾ */}
      <section id="pha-che" className="scroll-mt-32 pt-20">
        <HienDan>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="chi-muc mb-2 text-kin">Phòng I · 希釈</p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Pha chế &amp; pha loãng dung dịch</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">
                Gõ tên chất, PubChem trả về khối lượng mol chính xác đến hàng phần nghìn.
                Máy nghiền số liệu qua n = m/M và định luật C₁V₁ = C₂V₂,
                rồi rót dung dịch vào cốc với độ đậm đúng tỉ lệ nồng độ.
              </p>
            </div>
            <p className="font-mono text-xs text-washi-mo/70">n = m/M · C = n/V · C₁V₁ = C₂V₂</p>
          </div>
        </HienDan>
        <PhongPhaChe />
      </section>

      <div className="vach-kin my-24 opacity-40" />

      {/* PHÒNG 2 — CHUẨN ĐỘ */}
      <section id="chuan-do" className="scroll-mt-32">
        <HienDan>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="chi-muc mb-2 text-kin">Phòng II · 滴定</p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Chuẩn độ axit mạnh – bazơ mạnh</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">
                Mở khóa burette. Từng giọt bazơ rơi xuống, cân bằng mol H⁺/OH⁻ lật trạng thái,
                phenolphtalein bừng hồng đúng lúc pH vượt 8,2 — và đường cong chuẩn độ
                hình thành ngay trước mắt bạn.
              </p>
            </div>
            <p className="font-mono text-xs text-washi-mo/70">pH = −log[H⁺] · K_w = 10⁻¹⁴</p>
          </div>
        </HienDan>
        <PhongChuanDo />
      </section>

      <div className="vach-kin my-24 opacity-40" />

      {/* PHÒNG 3 — CHUYỂN PHA */}
      <section id="chuyen-pha" className="scroll-mt-32">
        <HienDan>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="chi-muc mb-2 text-kin">Phòng III · 相転移</p>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Buồng chuyển pha vi hạt</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-washi-mo">
                Đặt một nguyên tố vào lò. Khi nhiệt độ chạm mốc nóng chảy thật của nó — ví dụ
                sắt ở 1 811 K — mạng tinh thể sụp đổ thành dòng chảy; qua điểm sôi, từng hạt
                giành lấy tự do. Hai mốc nhiệt đều là số liệu đo từ PubChem.
              </p>
            </div>
            <p className="font-mono text-xs text-washi-mo/70">T &lt; T_nc → rắn · T_nc ≤ T &lt; T_s → lỏng · T ≥ T_s → khí</p>
          </div>
        </HienDan>
        {nguyenTo.length > 0 ? (
          <PhongChuyenPha nguyenTo={nguyenTo} />
        ) : (
          <p className="the-khac rounded-2xl p-6 text-sm text-washi-mo">
            Đang chờ PubChem đáp lễ — tải lại trang sau vài giây.
          </p>
        )}
      </section>
    </main>
  );
}
