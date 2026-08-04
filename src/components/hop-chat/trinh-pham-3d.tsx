"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom, Check, Copy, ExternalLink, Loader2, Orbit, Pause, Ruler, RotateCw, Search,
} from "lucide-react";
import type { HopChat, HopChat3D } from "@/lib/pubchem";
import type { KetQuaDoLuong } from "@/lib/hinh-hoc-do-luong";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";
import { slugHoaHopChat } from "@/lib/slug";
import { useGiamChuyenDong } from "@/lib/dung-chuyen-dong";
import { useCheDoTietKiem } from "@/components/che-do-tiet-kiem";
import { PhanTu2D, useHoTroWebGL } from "@/components/ba-d/phan-tu-2d";
import { useIntersectionObserver } from "@/components/ba-d/lazy-canvas-wrapper";
import { useBanMauNguyenTo } from "@/components/ba-d/mat-phan-tu";

const CanhHopChat = dynamic(() => import("@/components/ba-d/canh-hop-chat"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <Loader2 className="animate-spin text-shu-sang" size={28} />
    </div>
  ),
});

function voiChiSo(cf: string | null) {
  if (!cf) return "—";
  return cf.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>));
}

export default function TrinhPham3D({
  tenBanDau = "caffeine",
  thuocTinhBanDau = null,
  baChieuBanDau = null,
}: {
  tenBanDau?: string;
  thuocTinhBanDau?: HopChat | null;
  baChieuBanDau?: HopChat3D | null;
}) {
  const [nhap, setNhap] = useState(tenBanDau);
  const [goiY, setGoiY] = useState<string[]>([]);
  const [thuocTinh, setThuocTinh] = useState<HopChat | null>(thuocTinhBanDau);
  const [baChieu, setBaChieu] = useState<HopChat3D | null>(baChieuBanDau);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const giam = useGiamChuyenDong();
  const [tuXoay, setTuXoay] = useState(!giam);
  const [daCopy, setDaCopy] = useState(false);
  const demNhap = useRef<NodeJS.Timeout | null>(null);
  const [tietKiem] = useCheDoTietKiem();
  const hoTroWebGL = useHoTroWebGL();
  // Chế độ tiết kiệm hoặc máy không có WebGL → dùng sơ đồ SVG 2D thay Canvas 3D.
  const dung2D = tietKiem || !hoTroWebGL;
  // Trong dung2D: giữ 2D vĩnh viễn. Ngoài dung2D: chỉ đổi sang Canvas 3D khi
  // khu vực này lọt khung nhìn HOẶC người dùng bấm nút kích hoạt thủ công.
  const { ref: khungCanvas, dangHienThi } = useIntersectionObserver();
  const [kichHoatThuCong, setKichHoatThuCong] = useState(false);
  const hienThi3D = !dung2D && (dangHienThi || kichHoatThuCong);
  const banMau = useBanMauNguyenTo();
  const [nangCaoBat, setNangCaoBat] = useState(false);
  const [ketQuaDoLuong, setKetQuaDoLuong] = useState<KetQuaDoLuong>(null);

  const tai = useCallback(async (ten: string) => {
    const q = ten.trim();
    if (!q) return;
    setDangTai(true);
    setLoi("");
    setGoiY([]);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/hop-chat/${encodeURIComponent(q)}`),
        fetch(`/api/hop-chat/${encodeURIComponent(q)}/3d`),
      ]);
      if (!r2.ok) throw new Error("không có dữ liệu 3D");
      setThuocTinh(r1.ok ? ((await r1.json()) as HopChat) : null);
      setBaChieu((await r2.json()) as HopChat3D);
      setNhap(q);
      // Cập nhật thanh địa chỉ thành permalink thật của hợp chất này — chỉ đổi URL
      // hiển thị (History API), KHÔNG điều hướng Next.js, để giữ nguyên Canvas 3D
      // đang chạy (tránh phá lại fix "context loss" khi remount Canvas mỗi lần đổi).
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/hop-chat/${slugHoaHopChat(q)}`);
      }
    } catch {
      setLoi(`PubChem không có mô hình 3D cho “${q}” — thử tên tiếng Anh (vd: caffeine, glucose).`);
      setBaChieu(null);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (demNhap.current) clearTimeout(demNhap.current);
    const q = nhap.trim();
    if (q.length < 2) return;
    demNhap.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/goi-y?tu=${encodeURIComponent(q)}`);
        if (r.ok) setGoiY(await r.json());
      } catch { /* bỏ qua */ }
    }, 260);
  }, [nhap]);

  const saoChep = async (van: string) => {
    try {
      await navigator.clipboard.writeText(van);
      setDaCopy(true);
      setTimeout(() => setDaCopy(false), 1600);
    } catch { /* bỏ qua */ }
  };

  return (
    <div>
      {/* Thanh tìm kiếm */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <div className="the-khac nut-vien flex items-center gap-3 rounded-2xl px-5 py-4">
            <Search size={19} className="shrink-0 text-shu-sang" />
            <input
              value={nhap}
              onChange={(e) => {
                const v = e.target.value;
                setNhap(v);
                if (v.trim().length < 2) setGoiY([]);
              }}
              onKeyDown={(e) => e.key === "Enter" && void tai(nhap)}
              placeholder="Tìm hợp chất trên PubChem: caffeine, vitamin c, paracetamol…"
              className="w-full bg-transparent outline-none placeholder:text-washi-mo/60"
              aria-label="Tìm hợp chất hóa học"
            />
            {dangTai && <Loader2 size={18} className="animate-spin text-kin" />}
          </div>
          <AnimatePresence>
            {goiY.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-washi/12 bg-sumi-nhat shadow-2xl"
              >
                {goiY.map((g) => (
                  <li key={g}>
                    <button
                      onClick={() => void tai(g)}
                      className="w-full px-5 py-3 text-left text-sm text-washi-mo hover:bg-shu/15 hover:text-washi"
                    >
                      {g}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {HOP_CHAT_NOI_BAT.map((g) => (
            <button
              key={g.ten}
              onClick={() => void tai(g.ten)}
              className="rounded-full border border-washi/12 px-3.5 py-1.5 text-xs text-washi-mo transition-all hover:-translate-y-0.5 hover:border-shu-sang hover:text-shu-sang"
            >
              {g.nhan}
            </button>
          ))}
        </div>
        {loi && <p className="mt-4 text-center text-sm text-shu-sang">{loi}</p>}
      </div>

      {/* Khán đài phân tử */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div ref={khungCanvas} className="the-khac relative h-[440px] overflow-hidden rounded-3xl sm:h-[540px]">
          <p className="chu-doc absolute left-5 top-6 z-10 text-[10px] text-washi/25">分子 — phân tử</p>
          {baChieu ? (
            hienThi3D ? (
              <CanhHopChat
                duLieu={baChieu}
                tuXoay={tuXoay}
                nangCaoBat={nangCaoBat}
                onKetQuaDoLuongDoi={setKetQuaDoLuong}
              />
            ) : (
              <div className="absolute inset-0 p-8">
                <PhanTu2D duLieu={baChieu} />
              </div>
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-washi-mo">
              <div className="text-center">
                <Atom size={40} className="mx-auto mb-3 text-washi/20" />
                <p className="text-sm">{dangTai ? "Đang truy vấn PubChem…" : "Chọn một hợp chất để dựng mô hình 3D"}</p>
              </div>
            </div>
          )}
          {baChieu && dung2D && (
            <p className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-[10px] text-washi-mo backdrop-blur">
              {tietKiem ? "Chế độ tiết kiệm: sơ đồ 2D thay mô hình 3D" : "Máy không hỗ trợ WebGL: sơ đồ 2D chiếu trực giao"}
            </p>
          )}
          {baChieu && !dung2D && !hienThi3D && (
            <button
              onClick={() => setKichHoatThuCong(true)}
              className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs text-washi-mo backdrop-blur transition-colors hover:border-shu-sang hover:text-washi"
            >
              Bật tương tác 3D xoay chiều
            </button>
          )}
          {baChieu && hienThi3D && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setTuXoay((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs backdrop-blur transition-colors hover:border-shu-sang"
              >
                {tuXoay ? <Pause size={13} /> : <RotateCw size={13} />}
                {tuXoay ? "Dừng xoay" : "Tự xoay"}
              </button>
              <button
                onClick={() => {
                  setNangCaoBat((v) => !v);
                  // Tắt chế độ nâng cao → xoá luôn kết quả đo cũ, tránh hiển thị
                  // như một số liệu vẫn "còn hiệu lực" trong khi công cụ đã tắt.
                  setKetQuaDoLuong(null);
                }}
                className="flex items-center gap-2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs backdrop-blur transition-colors hover:border-shu-sang"
              >
                <Ruler size={13} />
                {nangCaoBat ? "Tắt bề mặt VDW & đo lường" : "Bật bề mặt VDW & đo lường"}
              </button>
              <span className="hidden rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-[10px] text-washi-mo backdrop-blur sm:block">
                Kéo để xoay · cuộn để phóng
              </span>
            </div>
          )}
          {nangCaoBat && hienThi3D && (
            <p className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full border border-washi/15 bg-sumi/70 px-3 py-1 text-[10px] text-washi-mo backdrop-blur">
              Nhấp 2 nguyên tử để đo khoảng cách (Å) · nhấp thêm 1 để đo góc liên kết (°)
            </p>
          )}
        </div>

        {/* Thuộc tính thật */}
        <div className="space-y-4">
          <div className="the-khac rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="chi-muc text-shu-sang">Hồ sơ PubChem</h2>
                <p className="mt-2 font-display text-3xl font-bold">
                  {thuocTinh ? voiChiSo(thuocTinh.congThuc) : "—"}
                </p>
                <p className="mt-1 break-words font-mono text-[11px] text-washi-mo">
                  CID {thuocTinh?.cid ?? baChieu?.cid ?? "…"} · {thuocTinh?.iupac ?? ""}
                </p>
              </div>
              {thuocTinh && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${thuocTinh.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-kin/40 px-3 py-1.5 text-[11px] text-kin transition-colors hover:bg-kin hover:text-sumi"
                >
                  Nguồn gốc <ExternalLink size={11} />
                </a>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Khối lượng mol", thuocTinh?.khoiLuongMol != null ? `${thuocTinh.khoiLuongMol} g/mol` : "—"],
                ["Khối lượng chính xác", thuocTinh?.khoiLuongExact != null ? `${thuocTinh.khoiLuongExact} u` : "—"],
                ["logP (XLogP3)", thuocTinh?.xLogP != null ? String(thuocTinh.xLogP) : "—"],
                ["Diện tích phân cực TPSA", thuocTinh?.tpsa != null ? `${thuocTinh.tpsa} Å²` : "—"],
                ["Cho liên kết H", thuocTinh?.hbd != null ? String(thuocTinh.hbd) : "—"],
                ["Nhận liên kết H", thuocTinh?.hba != null ? String(thuocTinh.hba) : "—"],
                ["Liên kết xoay được", thuocTinh?.lienKetXoay != null ? String(thuocTinh.lienKetXoay) : "—"],
                ["Độ phức tạp", thuocTinh?.doPhucTap != null ? String(thuocTinh.doPhucTap) : "—"],
              ].map(([ten, giaTri]) => (
                <div key={ten as string} className="rounded-xl border border-washi/8 bg-washi/[0.03] p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-washi-mo">{ten}</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-washi">{giaTri}</dd>
                </div>
              ))}
            </dl>
          </div>

          {ketQuaDoLuong && (
            <div className="the-khac rounded-2xl p-4" aria-live="polite">
              <p className="chi-muc text-shu-sang">Kết quả đo lường 3D</p>
              <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-washi">
                {ketQuaDoLuong.loai === "khoangCach"
                  ? `d(#${ketQuaDoLuong.a + 1}–#${ketQuaDoLuong.b + 1}) = ${ketQuaDoLuong.angstrom.toFixed(3)} Å`
                  : `∠(#${ketQuaDoLuong.a + 1}–#${ketQuaDoLuong.b + 1}–#${ketQuaDoLuong.c + 1}) = ${ketQuaDoLuong.do.toFixed(1)}°`}
              </p>
            </div>
          )}

          {thuocTinh?.smiles && (
            <div className="the-khac rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="chi-muc text-kin">SMILES chuẩn</p>
                <button
                  onClick={() => void saoChep(thuocTinh.smiles ?? "")}
                  className="flex items-center gap-1.5 rounded-full border border-washi/15 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-kin hover:text-kin"
                >
                  {daCopy ? <Check size={12} className="text-tokiwa" /> : <Copy size={12} />}
                  {daCopy ? "Đã sao chép" : "Sao chép"}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-sm leading-relaxed text-washi">{thuocTinh.smiles}</p>
            </div>
          )}

          <p className="flex items-start gap-2 rounded-2xl border border-washi/8 p-4 text-[11px] leading-relaxed text-washi-mo">
            <Orbit size={14} className="mt-0.5 shrink-0 text-shu-sang" />
            Tọa độ nguyên tử &amp; bậc liên kết lấy từ conformer 3D thực nghiệm/tính toán của PubChem
            (record_type=3d). Màu nguyên tử theo quy ước CPK của chính PubChem.
          </p>
        </div>
      </div>

      {baChieu && (
        <details className="the-khac mt-6 rounded-2xl p-5">
          <summary className="cursor-pointer text-sm text-washi-mo">
            Xem dữ liệu phân tử dạng bảng (thay thế cho mô hình 3D)
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Danh sách nguyên tử của {baChieu.tenTruyVan}</caption>
              <thead>
                <tr className="border-b border-washi/10 text-left text-[10px] uppercase tracking-wider text-washi-mo">
                  <th scope="col" className="py-2 pr-3 font-normal">STT</th>
                  <th scope="col" className="py-2 pr-3 font-normal">Nguyên tố</th>
                  <th scope="col" className="py-2 pr-3 font-normal">x</th>
                  <th scope="col" className="py-2 pr-3 font-normal">y</th>
                  <th scope="col" className="py-2 font-normal">z</th>
                </tr>
              </thead>
              <tbody>
                {baChieu.nguyenTu.map((nt, i) => (
                  <tr key={i} className="border-b border-washi/5 font-mono text-xs">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-washi-mo">{i + 1}</th>
                    <td className="py-1.5 pr-3">
                      {banMau?.get(nt.so)?.kyHieu ?? nt.so} · {banMau?.get(nt.so)?.tenVi ?? "?"}
                    </td>
                    <td className="py-1.5 pr-3">{nt.x.toFixed(3)}</td>
                    <td className="py-1.5 pr-3">{nt.y.toFixed(3)}</td>
                    <td className="py-1.5">{nt.z.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {baChieu.lienKet.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Danh sách liên kết của {baChieu.tenTruyVan}</caption>
                <thead>
                  <tr className="border-b border-washi/10 text-left text-[10px] uppercase tracking-wider text-washi-mo">
                    <th scope="col" className="py-2 pr-3 font-normal">Nguyên tử A</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Nguyên tử B</th>
                    <th scope="col" className="py-2 font-normal">Bậc liên kết</th>
                  </tr>
                </thead>
                <tbody>
                  {baChieu.lienKet.map((lk, i) => (
                    <tr key={i} className="border-b border-washi/5 font-mono text-xs">
                      <td className="py-1.5 pr-3">#{lk.a + 1}</td>
                      <td className="py-1.5 pr-3">#{lk.b + 1}</td>
                      <td className="py-1.5">{lk.bac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
