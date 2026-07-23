import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import MoHinhBohr from "@/components/bang-tuan-hoan/mo-hinh-bohr";
import { layNguyenTheoKyHieu, layTatCaNguyenTo, type NguyenTo } from "@/lib/pubchem";
import { MAU_KHOI, NHAN_KHOI } from "@/lib/nguyen-to";

interface ThuocTinhTrang {
  params: Promise<{ kyhieu: string }>;
}

export async function generateStaticParams() {
  const tatCa = await layTatCaNguyenTo();
  return tatCa.map((n) => ({ kyhieu: n.kyHieu.toLowerCase() }));
}

export async function generateMetadata({ params }: ThuocTinhTrang): Promise<Metadata> {
  const { kyhieu } = await params;
  const n = await layNguyenTheoKyHieu(kyhieu);
  if (!n) return { title: "Không tìm thấy nguyên tố" };
  const moTa = `${n.tenVi} (${n.kyHieu}), số hiệu nguyên tử ${n.so}, khối lượng nguyên tử ${n.khoiLuong} u. ${n.giaDinhVi}${n.nongChayK ? `, nóng chảy ở ${n.nongChayK} K` : ""}${n.soiK ? `, sôi ở ${n.soiK} K` : ""}. Cấu hình electron: ${n.cauHinhElectron}. Số liệu trực tiếp từ PubChem PUG-REST.`;
  return {
    title: `${n.tenVi} (${n.kyHieu}) — Nguyên tố số ${n.so}`,
    description: moTa,
    alternates: { canonical: `/nguyen-to/${n.kyHieu.toLowerCase()}` },
    openGraph: {
      title: `${n.tenVi} (${n.kyHieu}) — Nguyên tố số ${n.so} · KAGAKU`,
      description: moTa,
    },
  };
}

function denC(k: number | null) {
  if (k === null) return "—";
  return (k - 273.15).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function dichNam(nam: string) {
  const t = nam.trim();
  if (t.toLowerCase() === "ancient") return "Từ thời gian cổ đại";
  return t || "—";
}

function ThanhDo({ nhan, giaTri, toiDa, donVi, mau }: {
  nhan: string; giaTri: number | null; toiDa: number; donVi: string; mau: string;
}) {
  const tyLe = giaTri !== null ? Math.max((giaTri / toiDa) * 100, 2.5) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-xs text-washi-mo">{nhan}</p>
        <span className="font-mono text-sm font-semibold tabular-nums text-washi">
          {giaTri !== null ? giaTri : "—"} <span className="text-[10px] text-washi-mo">{donVi}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-washi/10">
        <div
          className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${tyLe}%`, background: mau }}
        />
      </div>
    </div>
  );
}

export default async function TrangNguyenTo({ params }: ThuocTinhTrang) {
  const { kyhieu } = await params;
  const [n, tatCa] = await Promise.all([layNguyenTheoKyHieu(kyhieu), layTatCaNguyenTo()]);
  if (!n) notFound();

  const lonNhat = (lay: (x: NguyenTo) => number | null) =>
    Math.max(...tatCa.map((x) => lay(x) ?? 0), 1);

  const truoc = tatCa.find((x) => x.so === n.so - 1);
  const sau = tatCa.find((x) => x.so === n.so + 1);
  const mauKhoi = MAU_KHOI[n.khoi];

  const laDuDoanTrangThai = n.trangThaiCertainty === "du-doan";
  const laDuDoanCauHinh = n.cauHinhElectronCertainty === "du-doan";
  const nhanTrangThai = n.trangThai === "ran" ? "Rắn (STP)" : n.trangThai === "long" ? "Lỏng (STP)" : n.trangThai === "khi" ? "Khí (STP)" : n.trangThaiGoc;

  const suKien = [
    { nhan: "Khối lượng nguyên tử", v: n.khoiLuong !== null ? `${n.khoiLuong} u` : "—" },
    { nhan: "Điểm nóng chảy", v: n.nongChayK !== null ? `${n.nongChayK} K  (${denC(n.nongChayK)} °C)` : "—" },
    { nhan: "Điểm sôi", v: n.soiK !== null ? `${n.soiK} K  (${denC(n.soiK)} °C)` : "—" },
    { nhan: "Khối lượng riêng", v: n.matDo !== null ? `${n.matDo} g/cm³` : "—" },
    { nhan: "Mức oxi hóa", v: n.cacMucOxiHoa },
    { nhan: "Cấu hình electron", v: n.cauHinhElectron ? `${n.cauHinhElectron}${laDuDoanCauHinh ? " · dự đoán (chưa đo quang phổ)" : ""}` : "—" },
    { nhan: "Trạng thái chuẩn", v: n.trangThaiGoc ? `${laDuDoanTrangThai ? "Dự đoán: " : ""}${nhanTrangThai}` : "—" },
    { nhan: "Năm phát hiện", v: dichNam(n.namPhatHien) },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      {/* Đường mòn */}
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/bang-tuan-hoan" className="gach-dong hover:text-washi">Bảng tuần hoàn</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{n.tenVi}</span>
      </nav>

      {/* Anh hùng */}
      <section className="mt-10 grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="chi-muc mb-4" style={{ color: mauKhoi }}>
            {NHAN_KHOI[n.khoi]} · {n.giaDinhVi} · {n.kyHieu === "Au" ? "金" : "元素"}
          </p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <span
              className="font-display text-[7rem] font-black leading-none sm:text-[10rem]"
              style={{ color: mauKhoi, textShadow: `0 0 90px ${mauKhoi}55` }}
            >
              {n.kyHieu}
            </span>
            <div className="pb-4">
              <h1 className="font-display text-4xl font-bold sm:text-5xl">{n.tenVi}</h1>
              <p className="mt-2 font-mono text-sm text-washi-mo">
                {n.tenEn} · Z = {n.so}
                {n.chuKi ? ` · Chu kì ${n.chuKi}` : ""}
                {n.nhom ? ` · Nhóm ${n.nhom}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-washi/15 px-4 py-1.5 text-xs text-washi-mo">
              Sắp xếp lớp vỏ: {n.lopVo.join(" · ") || "—"} e⁻
              {n.cauHinhElectronCertainty === "du-doan" && " · dự đoán"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-washi/15 px-4 py-1.5 text-xs text-washi-mo">
              Màu CPK
              <i className="h-3.5 w-3.5 rounded-full border border-washi/30" style={{ background: n.mauCPK }} />
            </span>
          </p>
        </div>

        <div className="the-khac relative flex justify-center rounded-3xl p-8">
          <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">原子 — nguyên tử</p>
          <MoHinhBohr lopVo={n.lopVo} kyHieu={n.kyHieu} mau={mauKhoi} />
        </div>
      </section>

      {/* Thanh đo */}
      <section className="mt-16">
        <h2 className="chi-muc mb-6 text-shu-sang">Thước đo tính chất — quy chuẩn trên 118 nguyên tố</h2>
        <div className="grid gap-x-10 gap-y-6 rounded-3xl border border-washi/10 bg-sumi-nhat/50 p-7 sm:grid-cols-2 sm:p-9">
          <ThanhDo nhan="Độ âm điện (Pauling)" giaTri={n.doAmDien} toiDa={lonNhat((x) => x.doAmDien)} donVi="" mau={mauKhoi} />
          <ThanhDo nhan="Bán kính nguyên tử" giaTri={n.banKinhPm} toiDa={lonNhat((x) => x.banKinhPm)} donVi="pm" mau={mauKhoi} />
          <ThanhDo nhan="Năng lượng ion hóa thứ nhất" giaTri={n.nangLuongIonHoa} toiDa={lonNhat((x) => x.nangLuongIonHoa)} donVi="eV" mau={mauKhoi} />
          <ThanhDo nhan="Ái lực electron" giaTri={n.aiLucElectron} toiDa={lonNhat((x) => x.aiLucElectron)} donVi="eV" mau={mauKhoi} />
        </div>
      </section>

      {/* Sổ sự kiện */}
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {suKien.map((s) => (
          <div key={s.nhan} className="the-khac rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-washi-mo">{s.nhan}</p>
            <p className="mt-2 break-words font-mono text-sm font-medium leading-relaxed text-washi">{s.v}</p>
          </div>
        ))}
      </section>

      {/* Điều hướng láng giềng */}
      <div className="mt-16 flex items-center justify-between gap-4">
        {truoc ? (
          <Link
            href={`/nguyen-to/${truoc.kyHieu.toLowerCase()}`}
            className="the-khac group flex items-center gap-3 rounded-2xl px-5 py-4 transition-transform hover:-translate-x-1"
          >
            <ArrowLeft size={16} className="text-shu-sang" />
            <span>
              <span className="block text-[10px] text-washi-mo">Z = {truoc.so}</span>
              <span className="font-display font-bold" style={{ color: MAU_KHOI[truoc.khoi] }}>{truoc.tenVi}</span>
            </span>
          </Link>
        ) : <span />}
        <Link href="/bang-tuan-hoan" className="gach-dong text-sm text-washi-mo hover:text-washi">
          Về bảng tuần hoàn
        </Link>
        {sau ? (
          <Link
            href={`/nguyen-to/${sau.kyHieu.toLowerCase()}`}
            className="the-khac group flex items-center gap-3 rounded-2xl px-5 py-4 text-right transition-transform hover:translate-x-1"
          >
            <span>
              <span className="block text-[10px] text-washi-mo">Z = {sau.so}</span>
              <span className="font-display font-bold" style={{ color: MAU_KHOI[sau.khoi] }}>{sau.tenVi}</span>
            </span>
            <ArrowRight size={16} className="text-shu-sang" />
          </Link>
        ) : <span />}
      </div>

      <p className="mt-10 flex items-center gap-2 text-[11px] text-washi-mo">
        <ExternalLink size={12} className="text-kin" />
        Toàn bộ số liệu trên trang này từ{" "}
        <a
          href={`https://pubchem.ncbi.nlm.nih.gov/element/${n.so}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gach-dong text-kin"
        >
          Trang nguyên tố #{n.so} trên PubChem
        </a>
      </p>
    </main>
  );
}
