"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom, Check, Copy, ExternalLink, Loader2, Orbit, Pause, RotateCw, Search,
} from "lucide-react";
import type { HopChat, HopChat3D } from "@/lib/pubchem";

const CanhHopChat = dynamic(() => import("@/components/ba-d/canh-hop-chat"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <Loader2 className="animate-spin text-shu-sang" size={28} />
    </div>
  ),
});

const GOI_Y_NHANH = [
  { ten: "benzene", nhan: "Benzene — vòng thơm" },
  { ten: "caffeine", nhan: "Caffeine" },
  { ten: "aspirin", nhan: "Aspirin" },
  { ten: "glucose", nhan: "Glucose" },
  { ten: "water", nhan: "Nước" },
  { ten: "ethanol", nhan: "Ethanol" },
  { ten: "chlorophyll a", nhan: "Diệp lục" },
  { ten: "adenosine triphosphate", nhan: "ATP" },
];

function voiChiSo(cf: string | null) {
  if (!cf) return "—";
  return cf.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>));
}

export default function TrinhPham3D() {
  const [nhap, setNhap] = useState("caffeine");
  const [goiY, setGoiY] = useState<string[]>([]);
  const [thuocTinh, setThuocTinh] = useState<HopChat | null>(null);
  const [baChieu, setBaChieu] = useState<HopChat3D | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const [tuXoay, setTuXoay] = useState(true);
  const [daCopy, setDaCopy] = useState(false);
  const demNhap = useRef<NodeJS.Timeout | null>(null);

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
    } catch {
      setLoi(`PubChem không có mô hình 3D cho “${q}” — thử tên tiếng Anh (vd: caffeine, glucose).`);
      setBaChieu(null);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    void tai("caffeine");
  }, [tai]);

  useEffect(() => {
    if (demNhap.current) clearTimeout(demNhap.current);
    const q = nhap.trim();
    if (q.length < 2) return setGoiY([]);
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
              onChange={(e) => setNhap(e.target.value)}
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
          {GOI_Y_NHANH.map((g) => (
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
        <div className="the-khac relative h-[440px] overflow-hidden rounded-3xl sm:h-[540px]">
          <p className="chu-doc absolute left-5 top-6 z-10 text-[10px] text-washi/25">分子 — phân tử</p>
          {baChieu ? (
            <CanhHopChat duLieu={baChieu} tuXoay={tuXoay} />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-washi-mo">
              <div className="text-center">
                <Atom size={40} className="mx-auto mb-3 text-washi/20" />
                <p className="text-sm">{dangTai ? "Đang truy vấn PubChem…" : "Chọn một hợp chất để dựng mô hình 3D"}</p>
              </div>
            </div>
          )}
          {baChieu && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
              <button
                onClick={() => setTuXoay((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs backdrop-blur transition-colors hover:border-shu-sang"
              >
                {tuXoay ? <Pause size={13} /> : <RotateCw size={13} />}
                {tuXoay ? "Dừng xoay" : "Tự xoay"}
              </button>
              <span className="hidden rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-[10px] text-washi-mo backdrop-blur sm:block">
                Kéo để xoay · cuộn để phóng
              </span>
            </div>
          )}
        </div>

        {/* Thuộc tính thật */}
        <div className="space-y-4">
          <div className="the-khac rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="chi-muc text-shu-sang">Hồ sơ PubChem</p>
                <h3 className="mt-2 font-display text-3xl font-bold">
                  {thuocTinh ? voiChiSo(thuocTinh.congThuc) : "—"}
                </h3>
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
    </div>
  );
}
