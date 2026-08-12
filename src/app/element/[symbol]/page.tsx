import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import BohrModel from "@/components/periodic-table/bohr-model";
import { getElementBySymbol, fetchAllElements, type ElementInfo } from "@/lib/pubchem";
import { BLOCK_COLORS, BLOCK_LABELS } from "@/lib/element";
import { canRedirect } from "@/lib/substance-identification";

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateStaticParams() {
  const allElements = await fetchAllElements();
  return allElements.map((n) => ({ symbol: n.symbol.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  if (canRedirect(symbol)) return {};

  const n = await getElementBySymbol(symbol);
  if (!n) return { title: "Không tìm thấy nguyên tố" };
  const description = `${n.vietnameseName} (${n.symbol}), số hiệu nguyên tử ${n.atomicNumber}, khối lượng nguyên tử ${n.atomicMass} u. ${n.groupFamilyVi}${n.meltingPointK ? `, nóng chảy ở ${n.meltingPointK} K` : ""}${n.boilingPointK ? `, sôi ở ${n.boilingPointK} K` : ""}. Cấu hình electron: ${n.electronConfig}. Số liệu trực tiếp từ PubChem PUG-REST.`;
  return {
    title: `${n.vietnameseName} (${n.symbol}) — Nguyên tố số ${n.atomicNumber}`,
    description,
    alternates: { canonical: `/element/${n.symbol.toLowerCase()}` },
    openGraph: {
      title: `${n.vietnameseName} (${n.symbol}) — Nguyên tố số ${n.atomicNumber} · KAGAKU`,
      description,
    },
  };
}

function toCelsius(k: number | null) {
  if (k === null) return "—";
  return (k - 273.15).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function formatDiscoveryYear(nam: string) {
  const t = nam.trim();
  if (t.toLowerCase() === "ancient") return "Từ thời gian cổ đại";
  return t || "—";
}

function PropertyGauge({ label, value, max, unit, color }: {
  label: string; value: number | null; max: number; unit: string; color: string;
}) {
  const percent = value !== null ? Math.max((value / max) * 100, 2.5) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-xs text-washi-mo">{label}</p>
        <span className="font-mono text-sm font-semibold tabular-nums text-washi">
          {value !== null ? value : "—"} <span className="text-[10px] text-washi-mo">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-washi/10">
        <div
          className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default async function ElementPage({ params }: PageProps) {
  const { symbol } = await params;

  // URL with diacritics / uppercase / odd characters → 308 to canonical ASCII,
  // the same error-avoidance mechanism as /compound/[name] (e.g. /element/đồng
  // used to 500 instead of a clean 404).
  const canon = canRedirect(symbol);
  if (canon) permanentRedirect(`/element/${canon}`);

  const [n, allElements] = await Promise.all([getElementBySymbol(symbol), fetchAllElements()]);
  if (!n) notFound();

  const maxOf = (lay: (x: ElementInfo) => number | null) =>
    Math.max(...allElements.map((x) => lay(x) ?? 0), 1);

  const previous = allElements.find((x) => x.atomicNumber === n.atomicNumber - 1);
  const next = allElements.find((x) => x.atomicNumber === n.atomicNumber + 1);
  const blockColor = BLOCK_COLORS[n.block];

  const isStatePredicted = n.stateCertainty === "du-doan";
  const isConfigPredicted = n.electronConfigCertainty === "du-doan";
  const stateLabel = n.stateOfMatter === "ran" ? "Rắn (STP)" : n.stateOfMatter === "long" ? "Lỏng (STP)" : n.stateOfMatter === "khi" ? "Khí (STP)" : n.rawState;

  const facts = [
    { label: "Khối lượng nguyên tử", v: n.atomicMass !== null ? `${n.atomicMass} u` : "—" },
    { label: "Điểm nóng chảy", v: n.meltingPointK !== null ? `${n.meltingPointK} K  (${toCelsius(n.meltingPointK)} °C)` : "—" },
    { label: "Điểm sôi", v: n.boilingPointK !== null ? `${n.boilingPointK} K  (${toCelsius(n.boilingPointK)} °C)` : "—" },
    { label: "Khối lượng riêng", v: n.density !== null ? `${n.density} g/cm³` : "—" },
    { label: "Mức oxi hóa", v: n.oxidationStates },
    { label: "Cấu hình electron", v: n.electronConfig ? `${n.electronConfig}${isConfigPredicted ? " · dự đoán (chưa đo quang phổ)" : ""}` : "—" },
    { label: "Trạng thái chuẩn", v: n.rawState ? `${isStatePredicted ? "Dự đoán: " : ""}${stateLabel}` : "—" },
    { label: "Năm phát hiện", v: formatDiscoveryYear(n.yearDiscovered) },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/periodic-table" className="gach-dong hover:text-washi">Bảng tuần hoàn</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{n.vietnameseName}</span>
      </nav>

      {/* Hero */}
      <section className="mt-10 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="chi-muc mb-4" style={{ color: blockColor }}>
            {BLOCK_LABELS[n.block]} · {n.groupFamilyVi} · {n.symbol === "Au" ? "金" : "元素"}
          </p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <span
              className="font-display text-[7rem] font-black leading-none sm:text-[10rem]"
              style={{ color: blockColor, textShadow: `0 0 90px ${blockColor}55` }}
            >
              {n.symbol}
            </span>
            <div className="pb-4">
              <h1 className="font-display text-4xl font-bold sm:text-5xl">{n.vietnameseName}</h1>
              <p className="mt-2 font-mono text-sm text-washi-mo">
                {n.englishName} · Z = {n.atomicNumber}
                {n.period ? ` · Chu kì ${n.period}` : ""}
                {n.group ? ` · Nhóm ${n.group}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-washi/15 px-4 py-1.5 text-xs text-washi-mo">
              Sắp xếp lớp vỏ: {n.electronShells.join(" · ") || "—"} e⁻
              {n.electronConfigCertainty === "du-doan" && " · dự đoán"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-washi/15 px-4 py-1.5 text-xs text-washi-mo">
              Màu CPK
              <i className="h-3.5 w-3.5 rounded-full border border-washi/30" style={{ background: n.cpkColor }} />
            </span>
          </p>
        </div>

        <div className="the-khac relative flex justify-center rounded-3xl p-8">
          <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">原子 — nguyên tử</p>
          <BohrModel shells={n.electronShells} symbol={n.symbol} color={blockColor} />
        </div>
      </section>

      {/* Property gauges */}
      <section className="mt-16">
        <h2 className="chi-muc mb-6 text-shu-sang">Thước đo tính chất — quy chuẩn trên 118 nguyên tố</h2>
        <div className="grid gap-x-10 gap-y-6 rounded-3xl border border-washi/10 bg-sumi-nhat/50 p-7 sm:grid-cols-2 sm:p-9">
          <PropertyGauge label="Độ âm điện (Pauling)" value={n.electronegativity} max={maxOf((x) => x.electronegativity)} unit="" color={blockColor} />
          <PropertyGauge label="Bán kính nguyên tử" value={n.radiusPm} max={maxOf((x) => x.radiusPm)} unit="pm" color={blockColor} />
          <PropertyGauge label="Năng lượng ion hóa thứ nhất" value={n.ionizationEnergy} max={maxOf((x) => x.ionizationEnergy)} unit="eV" color={blockColor} />
          <PropertyGauge label="Ái lực electron" value={n.electronAffinity} max={maxOf((x) => x.electronAffinity)} unit="eV" color={blockColor} />
        </div>
      </section>

      {/* Fact sheet */}
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((s) => (
          <div key={s.label} className="the-khac rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-washi-mo">{s.label}</p>
            <p className="mt-2 break-words font-mono text-sm font-medium leading-relaxed text-washi">{s.v}</p>
          </div>
        ))}
      </section>

      {/* Neighbor navigation */}
      <div className="mt-16 flex items-center justify-between gap-4">
        {previous ? (
          <Link
            href={`/element/${previous.symbol.toLowerCase()}`}
            className="the-khac group flex items-center gap-3 rounded-2xl px-5 py-4 transition-transform hover:-translate-x-1"
          >
            <ArrowLeft size={16} className="text-shu-sang" />
            <span>
              <span className="block text-[10px] text-washi-mo">Z = {previous.atomicNumber}</span>
              <span className="font-display font-bold" style={{ color: BLOCK_COLORS[previous.block] }}>{previous.vietnameseName}</span>
            </span>
          </Link>
        ) : <span />}
        <Link href="/periodic-table" className="gach-dong text-sm text-washi-mo hover:text-washi">
          Về bảng tuần hoàn
        </Link>
        {next ? (
          <Link
            href={`/element/${next.symbol.toLowerCase()}`}
            className="the-khac group flex items-center gap-3 rounded-2xl px-5 py-4 text-right transition-transform hover:translate-x-1"
          >
            <span>
              <span className="block text-[10px] text-washi-mo">Z = {next.atomicNumber}</span>
              <span className="font-display font-bold" style={{ color: BLOCK_COLORS[next.block] }}>{next.vietnameseName}</span>
            </span>
            <ArrowRight size={16} className="text-shu-sang" />
          </Link>
        ) : <span />}
      </div>

      <p className="mt-10 flex items-center gap-2 text-[11px] text-washi-mo">
        <ExternalLink size={12} className="text-kin" />
        Toàn bộ số liệu trên trang này từ{" "}
        <a
          href={`https://pubchem.ncbi.nlm.nih.gov/element/${n.atomicNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gach-dong text-kin"
        >
          Trang nguyên tố #{n.atomicNumber} trên PubChem
        </a>
      </p>
    </main>
  );
}
