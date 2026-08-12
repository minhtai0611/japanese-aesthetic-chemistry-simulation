import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Atom, Database, Droplets, FlaskConical,
  Scale, Thermometer, Sigma, Waypoints, Zap,
} from "lucide-react";
import HeroBackground from "@/components/hero-background";
import FadeIn from "@/components/fade-in";
import CountUp from "@/components/count-up";
import { fetchAllElements, type ElementInfo } from "@/lib/pubchem";
import { BLOCK_COLORS } from "@/lib/element";
import { DATA_SOURCES } from "@/lib/site";
import { LABS } from "@/lib/laboratory";

const LAB_ICONS = {
  preparation: Droplets,
  titration: FlaskConical,
  "phase-change": Thermometer,
  equilibrium: Scale,
  "electrochemical-cell": Zap,
} as const;

export default async function HomePage() {
  const elements = await fetchAllElements();
  const featuredElements = [79, 6, 8, 26, 47, 92]
    .map((z) => elements.find((n) => n.atomicNumber === z))
    .filter((n): n is ElementInfo => Boolean(n));

  return (
    <main>
      {/* ============================ HERO ============================ */}
      <section className="nen-shoji relative flex min-h-[100svh] items-center overflow-hidden">
        <HeroBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0b0a08_82%)]" />

        <div className="chu-doc absolute right-6 top-1/2 hidden -translate-y-1/2 select-none text-sm text-washi/25 lg:block">
          科学 ・ 実験 ・ 美
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-32 sm:px-8">
          <FadeIn>
            <p className="chi-muc mb-6 flex items-center gap-3 text-shu-sang">
              <span className="inline-block h-px w-10 bg-shu-sang" />
              仮想実験室 — PHÒNG THÍ NGHIỆM HÓA HỌC MỞ
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="max-w-4xl font-display text-[2.6rem] font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
              Chạm vào hóa học,
              <br />
              nơi <em className="font-medium italic text-shu-sang">dữ liệu mở</em> ngân
              <br className="hidden sm:block" /> thành <em className="font-medium italic text-kin">nghệ thuật</em>.
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-washi-mo sm:text-lg">
              Mô phỏng thí nghiệm ảo bằng tiếng Việt — bảng tuần hoàn 118 nguyên tố,
              phòng chuẩn độ, pha chế dung dịch, buồng chuyển pha và đài quan sát phân tử 3D.
              Mọi số liệu đến thẳng từ <strong className="font-semibold text-washi">PubChem PUG-REST</strong>, đồng bộ và lưu đệm có kiểm soát —
              không suy diễn, không dữ liệu thủ công.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/experiments"
                className="nut-chu group inline-flex items-center gap-2.5 rounded-full bg-shu px-7 py-3.5 font-semibold shadow-[0_0_44px_rgba(214,59,31,0.4)] transition-transform hover:scale-[1.04] active:scale-95"
              >
                <FlaskConical size={18} />
                Vào phòng thí nghiệm
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/periodic-table"
                className="gach-dong inline-flex items-center gap-2 rounded-full border border-washi/20 px-7 py-3.5 font-medium text-washi transition-colors hover:border-washi/50"
              >
                <Atom size={18} className="text-kin" />
                Khám phá bảng tuần hoàn
              </Link>
            </div>
          </FadeIn>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-washi-mo/70">
            <span className="chi-muc">Cuộn</span>
            <span className="h-10 w-px animate-hoi-tho bg-gradient-to-b from-shu-sang to-transparent" />
          </div>
        </div>
      </section>

      {/* ====================== SYMBOL MARQUEE STRIP ====================== */}
      <section aria-hidden className="relative overflow-hidden border-y border-washi/10 bg-sumi-nhat/60 py-4">
        <div className="flex w-max animate-truot-ngang gap-10 whitespace-nowrap">
          {[...Array(2)].map((_, copyIndex) => (
            <div key={copyIndex} className="flex gap-10">
              {elements.slice(0, 40).map((n) => (
                <span key={`${copyIndex}-${n.atomicNumber}`} className="flex items-baseline gap-1.5 font-mono text-sm text-washi-mo/80">
                  <span className="font-display text-base font-bold" style={{ color: BLOCK_COLORS[n.block] }}>{n.symbol}</span>
                  <span className="text-[11px]">{n.vietnameseName}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ========================= LIVE STATS ========================= */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-washi/10 bg-washi/10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: 118, suffix: "", label: "Nguyên tố từ bảng tuần hoàn PubChem", kanji: "元素" },
            { value: LABS.length, suffix: "", label: "Phòng thí nghiệm ảo tương tác", kanji: "実験" },
            { value: 100, suffix: " triệu+", label: "Hợp chất đăng ký trong PubChem CID", kanji: "分子" },
            { value: 0, suffix: "", label: "Điểm dữ liệu tự chế — cam kết tuyệt đối", kanji: "真" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.07} className="bg-sumi-nhat p-8">
              <p className="chu-doc float-right text-xs text-washi/20">{s.kanji}</p>
              <p className="font-display text-5xl font-black text-washi">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-washi-mo">{s.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ===================== FIVE FEATURED EXPERIMENTS ===================== */}
      <section className="hoa-van-song relative mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <FadeIn>
          <p className="chi-muc mb-3 text-shu-sang">五つの実験 — Ngũ đại thí nghiệm</p>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">
            Năm nghi lễ trong một <em className="text-kin">phòng thí nghiệm</em> không giới hạn
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LABS.map((p, i) => {
            const Icon = LAB_ICONS[p.slug];
            return (
              <FadeIn key={p.slug} delay={i * 0.08}>
                <Link
                  href={`/experiments/${p.slug}`}
                  className="the-khac group relative block h-full overflow-hidden rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1.5"
                >
                  <span className="pointer-events-none absolute -right-3 -top-6 select-none font-display text-[7rem] font-black leading-none text-washi/[0.045] transition-colors duration-500 group-hover:text-shu/15">
                    {p.kanji}
                  </span>
                  <span className="inline-flex rounded-2xl border border-shu/35 bg-shu/10 p-3 text-shu-sang">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{p.label}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-washi-mo">{p.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-kin">
                    Khám phá <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ====================== FEATURED ELEMENTS ====================== */}
      {featuredElements.length > 0 && (
        <section className="border-y border-washi/8 bg-sumi-nhat/50">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <FadeIn className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="chi-muc mb-3 text-shu-sang">元素の粋 — Tinh túy nguyên tố</p>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Từ hơi thở hiđrô tới <em className="text-kin">ánh kim vàng ròng</em>
                </h2>
              </div>
              <Link href="/periodic-table" className="gach-dong text-sm font-medium text-washi-mo hover:text-washi">
                Xem đủ 118 nguyên tố →
              </Link>
            </FadeIn>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {featuredElements.map((n, i) => (
                <FadeIn key={n.atomicNumber} delay={i * 0.06}>
                  <Link
                    href={`/element/${n.symbol.toLowerCase()}`}
                    className="group block overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_44px_rgba(0,0,0,0.5)]"
                    style={{
                      borderColor: `${BLOCK_COLORS[n.block]}55`,
                      background: `linear-gradient(165deg, ${BLOCK_COLORS[n.block]}26, #100e0a 72%)`,
                    }}
                  >
                    <span className="font-mono text-xs text-washi-mo">{n.atomicNumber}</span>
                    <p className="mt-1 font-display text-4xl font-black" style={{ color: BLOCK_COLORS[n.block] }}>
                      {n.symbol}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">{n.vietnameseName}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-washi-mo">
                      {n.atomicMass} u · {n.groupFamilyVi}
                    </p>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================== OPEN DATA MANIFESTO =================== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <FadeIn>
            <p className="chi-muc mb-3 text-shu-sang">信条 — Tín điều</p>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
              Dữ liệu mở, <em className="text-shu-sang">đạo đức mở</em>
            </h2>
            <p className="mt-6 font-display text-2xl italic leading-relaxed text-kin">
              「温故知新」<br />
              <span className="text-base not-italic text-washi-mo">
                Ôn lại tri thức cổ xưa, thấm nhuần kỹ thuật hiện tại, dệt nên kết nối tương lai.
              </span>
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                icon: Database,
                title: "Không suy diễn số liệu",
                description: `Khối lượng, điểm sôi, cấu hình electron, tọa độ 3D — tất cả đều đến từ ${DATA_SOURCES.name} của ${DATA_SOURCES.provider}. Website không kho lưu trữ riêng và không điền tay bất kỳ con số nào.`,
              },
              {
                icon: Sigma,
                title: "Toán học minh bạch",
                description: "Mỗi mô phỏng ghi công thức bên cạnh kết quả: n = m/M, C₁V₁ = C₂V₂, pH = −log[H⁺] với K_w = 10⁻¹⁴. Bạn kiểm chứng được từng bước tính.",
              },
              {
                icon: Waypoints,
                title: "Đồng bộ có kiểm soát",
                description: "Dữ liệu được đồng bộ từ PubChem và lưu đệm có kiểm soát (tối đa 7 ngày) — tôn trọng giới hạn tần suất của một máy chủ công cộng, thay vì truy vấn trực tiếp ở mỗi lượt xem.",
              },
            ].map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.08}>
                <div className="the-khac flex gap-5 rounded-2xl p-6">
                  <span className="mt-1 inline-flex h-fit rounded-xl border border-kin/35 bg-kin/10 p-2.5 text-kin">
                    <c.icon size={18} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-washi-mo">{c.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="relative overflow-hidden border-t border-washi/10">
        <div className="nen-shoji absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 text-center sm:px-8">
          <FadeIn>
            <p className="chi-muc mb-4 text-shu-sang">始めよう — Bắt đầu thôi</p>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
              Mở khóa <em className="text-shu-sang">burette</em> đầu tiên của bạn
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-washi-mo">
              Không cần áo blouse, không cần phòng lab. Chỉ cần sự tò mò —
              phần còn lại đã được pha sẵn từ dữ liệu mở.
            </p>
            <Link
              href="/experiments"
              className="nut-chu mt-10 inline-flex items-center gap-2.5 rounded-full bg-shu px-9 py-4 text-lg font-semibold shadow-[0_0_50px_rgba(214,59,31,0.45)] transition-transform hover:scale-[1.05] active:scale-95"
            >
              <FlaskConical size={20} />
              Vào phòng thí nghiệm ngay
            </Link>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
