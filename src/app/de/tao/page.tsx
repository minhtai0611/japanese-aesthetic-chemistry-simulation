"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, GraduationCap, Loader2 } from "lucide-react";
import HienDan from "@/components/hien-dan";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";
import type { SlugPhong } from "@/lib/phong-thi-nghiem";

const SO_CAU_TOI_THIEU = 3;
const SO_CAU_TOI_DA = 20;

interface KetQuaTaoDe {
  ma: string;
  maQuanTri: string;
  soCau: number;
}

function NutSaoChep({ gia }: { gia: string }) {
  const [daChep, setDaChep] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(gia);
        setDaChep(true);
        setTimeout(() => setDaChep(false), 1600);
      }}
      className="flex items-center gap-1.5 rounded-full border border-washi/15 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-kin hover:text-kin"
    >
      {daChep ? <Check size={12} className="text-tokiwa" /> : <Copy size={12} />}
      {daChep ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

export default function TrangTaoDe() {
  const [ten, setTen] = useState("");
  const [lop, setLop] = useState("");
  const [loaiPhong, setLoaiPhong] = useState<SlugPhong>("chuan-do");
  const [soCau, setSoCau] = useState(10);
  const [dangTao, setDangTao] = useState(false);
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState<KetQuaTaoDe | null>(null);

  const tao = async () => {
    if (!ten.trim()) {
      setLoi("Nhập tên đề trước đã.");
      return;
    }
    setDangTao(true);
    setLoi("");
    try {
      const r = await fetch("/api/de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten, lop: lop.trim() || undefined, loaiPhong, soCau }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.loi ?? "Không tạo được đề — thử lại.");
      setKetQua({ ma: d.ma, maQuanTri: d.maQuanTri, soCau: d.cauHoi.length });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Lỗi không rõ — thử lại.");
    } finally {
      setDangTao(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">教師モード — Chế độ giáo viên</p>
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Tạo đề <em className="text-shu-sang">bài tập</em>
        </h1>
        <p className="mt-6 leading-relaxed text-washi-mo">
          Mỗi câu sinh tất định từ số ngẫu nhiên có seed ghép với số liệu thật (PubChem, bảng nguyên tố, phương trình
          đã kiểm chứng) — không dùng AI, chấm điểm bằng so khớp số trong dung sai. Học sinh vào bằng mã 6 ký tự,
          không cần đăng nhập.
        </p>
      </HienDan>

      {ketQua ? (
        <div className="the-khac mt-10 rounded-3xl p-7 text-center">
          <GraduationCap size={32} className="mx-auto mb-4 text-kin" />
          <p className="text-sm text-washi-mo">Đã tạo {ketQua.soCau} câu. Chia sẻ mã cho học sinh, giữ mã quản trị cho riêng bạn.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-washi/12 p-5">
              <p className="chi-muc text-shu-sang">Mã đề (cho học sinh)</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-washi">{ketQua.ma}</p>
              <div className="mt-3 flex justify-center gap-2">
                <NutSaoChep gia={ketQua.ma} />
                <Link
                  href={`/de/${ketQua.ma}`}
                  className="flex items-center gap-1.5 rounded-full border border-washi/15 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-kin hover:text-kin"
                >
                  Mở /de/{ketQua.ma}
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-washi/12 p-5">
              <p className="chi-muc text-kin">Mã quản trị (giữ riêng)</p>
              <p className="mt-2 break-all font-mono text-lg font-bold text-washi">{ketQua.maQuanTri}</p>
              <div className="mt-3 flex justify-center gap-2">
                <NutSaoChep gia={ketQua.maQuanTri} />
                <Link
                  href={`/de/${ketQua.ma}/ket-qua?admin=${ketQua.maQuanTri}`}
                  className="flex items-center gap-1.5 rounded-full border border-washi/15 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-kin hover:text-kin"
                >
                  Xem kết quả
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setKetQua(null)}
            className="mt-8 text-xs text-washi-mo underline-offset-4 hover:text-washi hover:underline"
          >
            Tạo đề khác
          </button>
        </div>
      ) : (
        <div className="the-khac mt-10 space-y-5 rounded-3xl p-7">
          <div>
            <label htmlFor="ten-de" className="mb-1.5 block text-xs text-washi-mo">
              Tên đề
            </label>
            <input
              id="ten-de"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="Kiểm tra 15 phút — Chuẩn độ axit–bazơ"
              className="the-khac w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-washi-mo/50"
            />
          </div>

          <div>
            <label htmlFor="lop" className="mb-1.5 block text-xs text-washi-mo">
              Lớp (tuỳ chọn)
            </label>
            <input
              id="lop"
              value={lop}
              onChange={(e) => setLop(e.target.value)}
              placeholder="10A1"
              className="the-khac w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-washi-mo/50"
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-washi-mo">Phòng thí nghiệm</p>
            <div className="flex flex-wrap gap-2">
              {CAC_PHONG.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setLoaiPhong(p.slug)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    loaiPhong === p.slug ? "bg-shu text-white" : "border border-washi/15 text-washi-mo hover:border-washi/40"
                  }`}
                >
                  {p.nhan}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-xs text-washi-mo">Số câu</p>
              <span className="font-mono text-sm font-semibold text-shu-sang tabular-nums">{soCau}</span>
            </div>
            <input
              type="range"
              min={SO_CAU_TOI_THIEU}
              max={SO_CAU_TOI_DA}
              step={1}
              value={soCau}
              onChange={(e) => setSoCau(Number(e.target.value))}
              className="w-full cursor-ew-resize"
              aria-label="Số câu"
              aria-valuetext={`${soCau} câu`}
            />
          </div>

          {loi && <p className="text-sm text-shu-sang">{loi}</p>}

          <button
            type="button"
            onClick={() => void tao()}
            disabled={dangTao}
            className="nut-chu flex w-full items-center justify-center gap-2 rounded-full bg-shu px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {dangTao ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
            {dangTao ? "Đang sinh đề…" : "Tạo đề"}
          </button>
        </div>
      )}
    </main>
  );
}
