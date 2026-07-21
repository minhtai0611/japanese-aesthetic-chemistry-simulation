"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

/** pH dung dịch axit mạnh–bazơ mạnh từ số mol & Kw = 1e-14 (25 °C) — toán thuần, không suy diễn */
function pHChuanDo(Ca: number, Va: number, Cb: number, Vb: number): number {
  const molH = Ca * Va;       // mmol H⁺
  const molOH = Cb * Vb;      // mmol OH⁻
  const tong = Va + Vb;       // mL  (mmol/mL === mol/L)
  const du = molH - molOH;
  if (Math.abs(du) / tong < 1e-9) return 7;
  if (du > 0) return -Math.log10(du / tong);
  return 14 + Math.log10(-du / tong);
}

function mauLongTheoPh(pH: number): string {
  if (pH < 8.2) return "#cfdde6"; // phenolphtalein không màu
  if (pH < 10) return "#f0a8c0";  // hồng nhạt vùng chuyển
  return "#e0246e";               // hồng cánh sen
}

export default function PhongChuanDo() {
  const [ca, setCa] = useState(0.1);   // mol/L axit mạnh
  const [cb, setCb] = useState(0.1);   // mol/L bazơ mạnh
  const [va, setVa] = useState(25);    // mL axit trong bình
  const [vb, setVb] = useState(0);     // mL bazơ đã nhỏ
  const [chay, setChay] = useState(false);

  const vTuongDuong = (ca * va) / cb;
  const vToiDa = Math.min(Math.max(vTuongDuong * 2.4, va), 800);

  const pH = pHChuanDo(ca, va, cb, vb);
  const mauLong = mauLongTheoPh(pH);
  const mucLong = Math.min(14 + ((va + vb) / (va + Math.max(vToiDa, va))) * 62, 78);

  const demChay = useRef<number | null>(null);
  useEffect(() => {
    if (!chay) return;
    demChay.current = window.setInterval(() => {
      setVb((truoc) => {
        const tiep = truoc + vToiDa / 240;
        if (tiep >= vToiDa) {
          setChay(false);
          return vToiDa;
        }
        return tiep;
      });
    }, 40);
    return () => {
      if (demChay.current) window.clearInterval(demChay.current);
    };
  }, [chay, vToiDa]);

  useEffect(() => {
    setVb(0);
    setChay(false);
  }, [ca, cb, va]);

  const duongConG = useMemo(() => {
    const W = 660, H = 340, PL = 46, PR = 18, PT = 20, PB = 34;
    const buoc = 260;
    let d = "";
    for (let i = 0; i <= buoc; i++) {
      const v = (vToiDa * i) / buoc;
      const p = Math.min(Math.max(pHChuanDo(ca, va, cb, v), 0), 14);
      const x = PL + (v / vToiDa) * (W - PL - PR);
      const y = PT + (1 - p / 14) * (H - PT - PB);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return { d, W, H, PL, PR, PT, PB };
  }, [ca, va, cb, vToiDa]);

  const { d, W, H, PL, PR, PT, PB } = duongConG;
  const viX = PL + (vb / vToiDa) * (W - PL - PR);
  const viY = PT + (1 - Math.min(Math.max(pH, 0), 14) / 14) * (H - PT - PB);
  const xTD = PL + (Math.min(vTuongDuong, vToiDa) / vToiDa) * (W - PL - PR);

  return (
    <div className="grid gap-8 xl:grid-cols-[1.35fr_1fr]">
      {/* Biểu đồ đường cong chuẩn độ */}
      <div className="the-khac relative overflow-hidden rounded-3xl p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="chi-muc text-shu-sang">Đường cong chuẩn độ · 滴定曲線</p>
            <p className="mt-1 text-sm text-washi-mo">
              Axit mạnh {ca.toFixed(2)} M ({va} mL) chuẩn bằng bazơ mạnh {cb.toFixed(2)} M
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-4xl font-bold tabular-nums" style={{ color: pH >= 8.2 ? "#ff7fa8" : "#f2ead9" }}>
              {pH.toFixed(2)}
            </p>
            <p className="chi-muc text-washi-mo">pH hiện tại</p>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Đường cong pH theo thể tích bazơ">
          <defs>
            <linearGradient id="doc-duong-cong" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f2ead9" />
              <stop offset={`${(vTuongDuong / vToiDa) * 100}%`} stopColor="#c9a35a" />
              <stop offset="100%" stopColor="#ff5b36" />
            </linearGradient>
          </defs>
          {/* lưới */}
          {[0, 2, 4, 6, 7, 8, 10, 12, 14].map((p) => {
            const y = PT + (1 - p / 14) * (H - PT - PB);
            return (
              <g key={p}>
                <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(242,234,217,0.07)" />
                <text x={PL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
                  {p}
                </text>
              </g>
            );
          })}
          {/* vùng chuyển màu phenolphtalein */}
          <rect
            x={PL}
            y={PT + (1 - 10 / 14) * (H - PT - PB)}
            width={W - PL - PR}
            height={((10 - 8.2) / 14) * (H - PT - PB)}
            fill="#e0246e"
            opacity={0.07}
          />
          {/* đường tương đương */}
          <line x1={xTD} x2={xTD} y1={PT} y2={H - PB} stroke="#c9a35a" strokeDasharray="4 5" strokeOpacity={0.55} />
          <text x={xTD} y={H - PB + 24} fontSize="10" textAnchor="middle" fill="#c9a35a" fontFamily="var(--font-mono)">
            V≈{vTuongDuong.toFixed(1)} mL
          </text>
          <motion.path
            key={`${ca}-${cb}-${va}`}
            d={d}
            fill="none"
            stroke="url(#doc-duong-cong)"
            strokeWidth={2.6}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <circle cx={viX} cy={viY} r={7} fill={mauLong} stroke="#0b0a08" strokeWidth={2.4} />
          <text x={PL} y={14} fontSize="10" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">pH</text>
          <text x={W - PR} y={H - 6} fontSize="10" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
            V bazơ nhỏ vào (mL)
          </text>
        </svg>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            type="range" min={0} max={vToiDa} step={vToiDa / 400} value={vb}
            onChange={(e) => { setChay(false); setVb(Number(e.target.value)); }}
            className="min-w-40 flex-1 cursor-ew-resize" aria-label="Thể tích bazơ đã nhỏ"
          />
          <span className="font-mono text-sm tabular-nums text-kin">{vb.toFixed(1)} mL</span>
          <div className="flex gap-2">
            <button
              onClick={() => setChay((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-shu px-4 py-2 text-xs font-semibold transition-transform hover:scale-105 active:scale-95"
            >
              {chay ? <Pause size={13} /> : <Play size={13} />} {chay ? "Tạm dừng" : "Mở khóa burette"}
            </button>
            <button
              onClick={() => { setVb(0); setChay(false); }}
              className="rounded-full border border-washi/20 p-2 text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              aria-label="Chuẩn độ lại từ đầu"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bàn thí nghiệm */}
      <div className="space-y-6">
        <div className="the-khac relative flex flex-col items-center overflow-hidden rounded-3xl p-6">
          <p className="chu-doc absolute right-5 top-5 text-[10px] text-washi/25">滴定 — chuẩn độ</p>

          {/* burette */}
          <svg viewBox="0 0 120 230" className="w-24">
            <rect x={52} y={6} width={16} height={120} rx={6} fill={mauLong} opacity={0.85} />
            <rect x={52} y={6} width={16} height={120} rx={6} fill="none" stroke="rgba(242,234,217,0.6)" strokeWidth={1.6} />
            <rect x={48} y={126} width={24} height={10} rx={3} fill="#8a7a5c" />
            <path d="M56 136 L56 156 L64 156 L64 136 Z" fill="rgba(242,234,217,0.35)" />
            {chay && (
              <motion.circle
                cx={60} r={3.2} fill={mauLong}
                initial={{ cy: 158 }}
                animate={{ cy: [158, 222], opacity: [1, 1, 0] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: "easeIn" }}
              />
            )}
          </svg>

          {/* bình tam giác */}
          <svg viewBox="0 0 220 170" className="-mt-1 w-full max-w-[260px]">
            <defs>
              <clipPath id="cat-binh">
                <path d="M96 12 L96 40 L46 146 Q40 160 56 160 L164 160 Q180 160 174 146 L124 40 L124 12 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#cat-binh)">
              <motion.rect
                x={0} width={220}
                fill={mauLong}
                initial={false}
                animate={{ y: 162 - mucLong * 1.4, height: mucLong * 1.4 + 20, opacity: pH < 8.2 ? 0.5 : 0.85 }}
                transition={{ type: "spring", stiffness: 50, damping: 14 }}
              />
            </g>
            <path
              d="M96 12 L96 40 L46 146 Q40 160 56 160 L164 160 Q180 160 174 146 L124 40 L124 12 M88 12 L132 12"
              fill="none" stroke="rgba(242,234,217,0.75)" strokeWidth="2.4" strokeLinecap="round"
            />
            {chay && [0, 1, 2, 3].map((i) => (
              <motion.circle
                key={i} r={3.5} fill="#f2ead9" opacity={0.7}
                animate={{ cx: [110, 80 + i * 20, 110], cy: [150, 120 - i * 4, 150] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </svg>

          <p className="mt-1 text-center font-mono text-xs text-washi-mo">
            Phenolphtalein: không màu pH &lt; 8,2 → hồng cánh sen pH &gt; 10
          </p>
          <p className="mt-2 text-center text-sm font-medium" style={{ color: pH >= 8.2 ? "#ff7fa8" : "#cfc6b2" }}>
            {Math.abs(vTuongDuong - vb) < vToiDa / 120
              ? "ĐIỂM TƯƠNG ĐƯƠNG — dung dịch trung tính, pH = 7"
              : vb < vTuongDuong
                ? "Trước điểm tương đương — dư axit"
                : "Quá điểm tương đương — dư bazơ"}
          </p>
        </div>

        {/* Tham số */}
        <div className="the-khac space-y-4 rounded-3xl p-6">
          {[
            { nhan: "Nồng độ axit (HCl) Cₐ", v: ca, dat: setCa, min: 0.02, max: 1, step: 0.01, hien: `${ca.toFixed(2)} M` },
            { nhan: "Nồng độ bazơ (NaOH) C_b", v: cb, dat: setCb, min: 0.02, max: 1, step: 0.01, hien: `${cb.toFixed(2)} M` },
            { nhan: "Thể tích axit Vₐ", v: va, dat: (x: number) => setVa(x), min: 10, max: 50, step: 5, hien: `${va} mL` },
          ].map((s) => (
            <div key={s.nhan}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-xs text-washi-mo">{s.nhan}</p>
                <span className="font-mono text-sm font-semibold text-shu-sang tabular-nums">{s.hien}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step} value={s.v}
                onChange={(e) => s.dat(Number(e.target.value))}
                className="w-full cursor-ew-resize" aria-label={s.nhan}
              />
            </div>
          ))}
          <p className="font-mono text-[11px] leading-relaxed text-washi-mo/80">
            Tính từ cân bằng mol H⁺/OH⁻ và tích số ion của nước K_w = 10⁻¹⁴ (25 °C). Đây là mô hình toán
            chính xác cho cặp axit mạnh–bazơ mạnh.
          </p>
        </div>
      </div>
    </div>
  );
}
