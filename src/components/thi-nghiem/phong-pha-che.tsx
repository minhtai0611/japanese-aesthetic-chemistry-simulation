"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, FlaskRound, Loader2, RefreshCcw, Search } from "lucide-react";
import type { HopChat } from "@/lib/pubchem";
import NutLuuSoTay from "@/components/so-tay/nut-luu-so-tay";

const CHAT_GOI_Y = [
  { ten: "NaOH", nhan: "NaOH — xút" },
  { ten: "NaCl", nhan: "NaCl — muối ăn" },
  { ten: "H2SO4", nhan: "H₂SO₄ — axit sunfuric" },
  { ten: "glucose", nhan: "Glucose — đường" },
  { ten: "copper sulfate", nhan: "CuSO₄ — đồng sunfat" },
  { ten: "KMnO4", nhan: "KMnO₄ — thuốc tím" },
  { ten: "ethanol", nhan: "C₂H₅OH — cồn" },
];

const BANG_MAU_DUNG_DICH = ["#d63b1f", "#3d5f9e", "#3e7d6b", "#b98c36", "#7a4fa3", "#2c7a8c"];

function congThucCoChuSo(cf: string | null | undefined) {
  if (!cf) return "—";
  return cf.split(/(\d+)/).map((p, i) =>
    /^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>,
  );
}

export default function PhongPhaChe({
  tenBanDau = "NaOH",
  hopChatBanDau = null,
}: {
  tenBanDau?: string;
  hopChatBanDau?: HopChat | null;
}) {
  const [cheDo, setCheDo] = useState<"hoa-tan" | "pha-loang">("hoa-tan");
  const [nhap, setNhap] = useState(tenBanDau);
  const [goiY, setGoiY] = useState<string[]>([]);
  const [hopChat, setHopChat] = useState<HopChat | null>(hopChatBanDau);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");

  // Hòa tan chất rắn
  const [c, setC] = useState(0.5);   // mol/L
  const [v, setV] = useState(250);   // mL
  // Pha loãng C₁V₁ = C₂V₂
  const [c1, setC1] = useState(1);
  const [v1, setV1] = useState<number | null>(50);
  const [c2, setC2] = useState(0.25);
  const [v2, setV2] = useState<number | null>(200);

  const demNhap = useRef<NodeJS.Timeout | null>(null);

  const taiHopChat = useCallback(async (ten: string) => {
    const q = ten.trim();
    if (!q) return;
    setDangTai(true);
    setLoi("");
    try {
      const r = await fetch(`/api/hop-chat/${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error();
      const d = (await r.json()) as HopChat;
      setHopChat(d);
      setNhap(q);
      setGoiY([]);
    } catch {
      setLoi(`Không tìm thấy “${q}” trên PubChem — kiểm tra lại tên hoặc công thức.`);
      setHopChat(null);
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
      } catch { /* im lặng */ }
    }, 260);
  }, [nhap]);

  const M = hopChat?.khoiLuongMol ?? null;
  const m = M ? c * (v / 1000) * M : null;

  // Giải pha loãng: một ô trống (null) sẽ được tính
  const giaiLoang = useMemo(() => {
    if (c1 <= 0) return {};
    if (v1 === null && c2 > 0 && v2) return { v1: (c2 * v2) / c1 };
    if (v2 === null && v1) return { v2: (c1 * v1) / c2 };
    return {};
  }, [c1, v1, c2, v2]);

  const v1Giai = v1 ?? giaiLoang.v1 ?? null;
  const v2Giai = v2 ?? giaiLoang.v2 ?? null;
  const nongDoSau = cheDo === "hoa-tan" ? c : c2;
  const theTichSau = cheDo === "hoa-tan" ? v : v2Giai ?? 0;

  const mauDungDich = BANG_MAU_DUNG_DICH[(hopChat?.cid ?? 0) % BANG_MAU_DUNG_DICH.length];
  const doDam = Math.min(0.16 + Math.min(nongDoSau / 2, 1) * 0.74, 0.9);
  const doCaoLong = Math.min(12 + (theTichSau / 1000) * 100, 92);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      {/* Điều khiển */}
      <div className="space-y-6">
        <div className="flex gap-2">
          {([["hoa-tan", "Hòa tan chất rắn"], ["pha-loang", "Pha loãng dung dịch"]] as const).map(([k, nhan]) => (
            <button
              key={k}
              onClick={() => setCheDo(k)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                cheDo === k ? "bg-shu text-white" : "border border-washi/15 text-washi-mo hover:border-washi/40"
              }`}
            >
              {nhan}
            </button>
          ))}
        </div>

        {/* Tìm chất */}
        <div>
          <p className="chi-muc mb-2 text-shu-sang">Chất tan — khối lượng mol từ PubChem</p>
          <div className="relative">
            <div className="the-khac flex items-center gap-3 rounded-2xl px-4 py-3">
              <Search size={16} className="text-shu-sang" />
              <input
                value={nhap}
                onChange={(e) => {
                  const v = e.target.value;
                  setNhap(v);
                  if (v.trim().length < 2) setGoiY([]);
                }}
                onKeyDown={(e) => e.key === "Enter" && void taiHopChat(nhap)}
                placeholder="Nhập tên hoặc công thức: NaOH, glucose, caffeine…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-washi-mo/60"
              />
              {dangTai && <Loader2 size={16} className="animate-spin text-kin" />}
            </div>
            <AnimatePresence>
              {goiY.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-washi/12 bg-sumi-nhat shadow-2xl"
                >
                  {goiY.map((g) => (
                    <li key={g}>
                      <button
                        onClick={() => void taiHopChat(g)}
                        className="w-full px-4 py-2.5 text-left text-sm text-washi-mo hover:bg-shu/15 hover:text-washi"
                      >
                        {g}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHAT_GOI_Y.map((g) => (
              <button
                key={g.ten}
                onClick={() => void taiHopChat(g.ten)}
                className="rounded-full border border-washi/12 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {g.nhan}
              </button>
            ))}
          </div>
          {loi && <p className="mt-3 text-xs text-shu-sang">{loi}</p>}
          {hopChat && (
            <p className="mt-3 font-mono text-xs text-kin">
              {hopChat.congThuc} · M = {hopChat.khoiLuongMol} g/mol · CID {hopChat.cid} · PubChem
            </p>
          )}
        </div>

        {cheDo === "hoa-tan" ? (
          <div className="space-y-5">
            <DieuKhienTruot nhan="Nồng độ mục tiêu C" donVi="mol/L" min={0.01} max={3} buoc={0.01}
              giaTri={c} mauHien={`${c.toFixed(2)} M`} khiSua={setC} />
            <DieuKhienTruot nhan="Thể tích dung dịch V" donVi="mL" min={25} max={1000} buoc={5}
              giaTri={v} mauHien={`${v} mL`} khiSua={setV} />
            <div className="the-khac rounded-2xl p-5 font-mono text-sm leading-loose">
              <p className="chi-muc mb-3 text-shu-sang">Sổ tay tính toán · n = m/M</p>
              <p>n = C × V = {c.toFixed(2)} mol/L × {(v / 1000).toFixed(3)} L = <b className="text-washi">{(c * v / 1000).toFixed(4)} mol</b></p>
              <p>m = n × M = {(c * v / 1000).toFixed(4)} × {M ?? "…"} g/mol</p>
              <p className="mt-2 text-xl font-bold text-shu-sang" aria-live="polite">
                Cân {m ? m.toFixed(2) : "…"} g {hopChat ? congThucCoChuSo(hopChat.congThuc) : ""}
              </p>
            </div>
            {m != null && (
              <NutLuuSoTay
                loaiPhong="pha-che"
                tieuDe={`Hòa tan ${hopChat?.congThuc ?? nhap} — ${c.toFixed(2)} M, ${v} mL`}
                thamSo={{ cheDo: "hoa-tan", chat: hopChat?.congThuc ?? nhap, C: c, V: v }}
                ketQua={{ n: (c * v) / 1000, m }}
              />
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <DieuKhienTruot nhan="Nồng độ gốc C₁" donVi="mol/L" min={0.1} max={6} buoc={0.05}
              giaTri={c1} mauHien={`${c1.toFixed(2)} M`} khiSua={setC1} />
            <DieuKhienTruot nhan="Thể tích gốc lấy ra V₁" donVi="mL" min={0} max={1000} buoc={5}
              giaTri={v1 ?? 0} mauHien={v1 === null ? "Ẩn số" : `${v1} mL`}
              khiSua={(x) => setV1(x)} laAn={v1 === null} khiDatAn={() => setV1(null)} />
            <DieuKhienTruot nhan="Nồng độ mong muốn C₂" donVi="mol/L" min={0.01} max={6} buoc={0.01}
              giaTri={c2} mauHien={`${c2.toFixed(2)} M`} khiSua={setC2} />
            <DieuKhienTruot nhan="Thể tích mới V₂" donVi="mL" min={0} max={1000} buoc={5}
              giaTri={v2 ?? 0} mauHien={v2 === null ? "Ẩn số" : `${v2} mL`}
              khiSua={(x) => setV2(x)} laAn={v2 === null} khiDatAn={() => setV2(null)} />
            <div className="the-khac rounded-2xl p-5 font-mono text-sm leading-loose">
              <p className="chi-muc mb-3 text-shu-sang">Định luật pha loãng · C₁V₁ = C₂V₂</p>
              <p>{c1.toFixed(2)} M × {v1Giai?.toFixed(1) ?? "?"} mL = {c2.toFixed(2)} M × {v2Giai?.toFixed(1) ?? "?"} mL</p>
              {v1Giai !== null && v2Giai !== null && (
                <p className="mt-2 text-lg font-bold text-shu-sang" aria-live="polite">
                  Hút {v1Giai.toFixed(1)} mL dung dịch gốc → định mức nước cất tới {v2Giai.toFixed(0)} mL
                </p>
              )}
            </div>
            {v1Giai !== null && v2Giai !== null && (
              <NutLuuSoTay
                loaiPhong="pha-che"
                tieuDe={`Pha loãng — ${c1.toFixed(2)} M → ${c2.toFixed(2)} M`}
                thamSo={{ cheDo: "pha-loang", C1: c1, C2: c2, V1: v1, V2: v2 }}
                ketQua={{ V1: v1Giai, V2: v2Giai }}
              />
            )}
          </div>
        )}
      </div>

      {/* Cốc thí nghiệm */}
      <div className="the-khac relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl p-6">
        <p className="chu-doc absolute right-5 top-5 text-[10px] text-washi/25">希釈 — pha loãng</p>
        {/* pipette */}
        <div className="relative mb-1 h-16 w-3 rounded-b-full bg-gradient-to-b from-washi/25 to-washi/5">
          <motion.span
            key={`${cheDo}-${hopChat?.cid ?? 0}`}
            className="absolute left-1/2 top-14 h-2.5 w-2.5 rounded-full"
            style={{ background: mauDungDich, x: "-50%" }}
            animate={{ y: [0, 62], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.05, repeat: Infinity, repeatDelay: 1.8, ease: "easeIn" }}
          />
        </div>

        <svg viewBox="0 0 220 210" className="w-full max-w-[300px] flex-1">
          <defs>
            <clipPath id="cat-coc">
              <path d="M60 30 L60 170 Q60 190 80 190 L140 190 Q160 190 160 170 L160 30 L146 30 L146 168 Q146 178 136 178 L84 178 Q74 178 74 168 L74 30 Z" />
            </clipPath>
          </defs>

          {/* chất lỏng */}
          <g clipPath="url(#cat-coc)">
            <motion.rect
              x={60}
              width={100}
              fill={mauDungDich}
              initial={false}
              animate={{ y: 210 - (doCaoLong / 100) * 160 - 24, height: (doCaoLong / 100) * 160 + 34, opacity: doDam }}
              transition={{ type: "spring", stiffness: 42, damping: 13 }}
            />
            <ellipse cx="110" cy="0" rx="10" ry="10" fill="none" />
          </g>

          {/* vạch chia */}
          {[0.25, 0.5, 0.75].map((tyLe) => (
            <g key={tyLe} opacity={0.4}>
              <line x1={146} x2={154} y1={178 - tyLe * 140} y2={178 - tyLe * 140} stroke="#f2ead9" strokeWidth="1" />
              <text x={158} y={182 - tyLe * 140} fontSize="8" fill="#f2ead9" fontFamily="var(--font-mono)">
                {tyLe * 1000} mL
              </text>
            </g>
          ))}

          {/* thân cốc */}
          <path
            d="M60 30 L60 170 Q60 190 80 190 L140 190 Q160 190 160 170 L160 30 M52 30 L74 30 M146 30 L168 30"
            fill="none" stroke="rgba(242,234,217,0.75)" strokeWidth="2.4" strokeLinecap="round"
          />
        </svg>

        <div className="mt-2 flex items-center gap-3 text-center">
          <Droplets size={16} style={{ color: mauDungDich }} />
          <p className="font-mono text-sm text-washi">
            {congThucCoChuSo(hopChat?.congThuc)} · {nongDoSau.toFixed(2)} M · độ đậm ∝ nồng độ
          </p>
        </div>
        <p className="mt-2 flex items-center gap-2 text-[11px] text-washi-mo">
          <FlaskRound size={13} className="text-kin" />
          Mô phỏng trực quan — luôn tuân thủ an toàn phòng thí nghiệm thật.
        </p>
      </div>
    </div>
  );
}

function DieuKhienTruot({
  nhan, donVi, giaTri, min, max, buoc, mauHien, khiSua, laAn, khiDatAn,
}: {
  nhan: string;
  donVi: string;
  giaTri: number;
  min: number;
  max: number;
  buoc: number;
  mauHien: string;
  khiSua: (v: number) => void;
  laAn?: boolean;
  khiDatAn?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm text-washi-mo">
          {nhan} <span className="font-mono text-[10px] text-washi-mo/60">({donVi})</span>
        </p>
        <div className="flex items-center gap-3">
          {khiDatAn && (
            <button
              onClick={khiDatAn}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] transition-colors ${
                laAn ? "bg-kin text-sumi" : "border border-washi/20 text-washi-mo hover:border-kin/60"
              }`}
            >
              <RefreshCcw size={10} /> đặt làm ẩn
            </button>
          )}
          <span className={`font-mono text-lg font-semibold tabular-nums ${laAn ? "text-kin" : "text-shu-sang"}`}>
            {mauHien}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={buoc}
        value={giaTri}
        disabled={laAn}
        onChange={(e) => khiSua(Number(e.target.value))}
        className="w-full cursor-ew-resize disabled:opacity-30"
        aria-label={nhan}
        aria-valuetext={laAn ? "Ẩn số — tính từ các giá trị khác" : mauHien}
      />
    </div>
  );
}
