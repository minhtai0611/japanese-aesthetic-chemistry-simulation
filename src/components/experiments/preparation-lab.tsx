"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, FlaskRound, Loader2, RefreshCcw, Search } from "lucide-react";
import type { Compound } from "@/lib/pubchem";

const SUGGESTED_COMPOUNDS = [
  { name: "NaOH", label: "NaOH — xút" },
  { name: "NaCl", label: "NaCl — muối ăn" },
  { name: "H2SO4", label: "H₂SO₄ — axit sunfuric" },
  { name: "glucose", label: "Glucose — đường" },
  { name: "copper sulfate", label: "CuSO₄ — đồng sunfat" },
  { name: "KMnO4", label: "KMnO₄ — thuốc tím" },
  { name: "ethanol", label: "C₂H₅OH — cồn" },
];

const SOLUTION_COLORS = ["#d63b1f", "#3d5f9e", "#3e7d6b", "#b98c36", "#7a4fa3", "#2c7a8c"];

function formulaWithSubscripts(cf: string | null | undefined) {
  if (!cf) return "—";
  return cf.split(/(\d+)/).map((p, i) =>
    /^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>,
  );
}

export default function PreparationLab({
  initialName = "NaOH",
  initialCompound = null,
}: {
  initialName?: string;
  initialCompound?: Compound | null;
}) {
  const [mode, setMode] = useState<"hoa-tan" | "pha-loang">("hoa-tan");
  const [query, setQuery] = useState(initialName);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [compound, setCompound] = useState<Compound | null>(initialCompound);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dissolving a solid
  const [concentration, setConcentration] = useState(0.5);   // mol/L
  const [volume, setVolume] = useState(250);   // mL
  // Dilution C₁V₁ = C₂V₂
  const [concentration1, setConcentration1] = useState(1);
  const [volume1, setVolume1] = useState<number | null>(50);
  const [concentration2, setConcentration2] = useState(0.25);
  const [volume2, setVolume2] = useState<number | null>(200);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadCompound = useCallback(async (name: string) => {
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/compound/${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error();
      const d = (await r.json()) as Compound;
      setCompound(d);
      setQuery(q);
      setSuggestions([]);
    } catch {
      setError(`Không tìm thấy “${q}” trên PubChem — kiểm tra lại tên hoặc công thức.`);
      setCompound(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const q = query.trim();
    if (q.length < 2) return;
    debounceTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`);
        if (r.ok) setSuggestions(await r.json());
      } catch { /* silent */ }
    }, 260);
  }, [query]);

  const M = compound?.molarMass ?? null;
  const m = M ? concentration * (volume / 1000) * M : null;

  // Solve dilution: whichever cell is blank (null) gets computed
  const dilutionSolve = useMemo(() => {
    if (concentration1 <= 0) return {};
    if (volume1 === null && concentration2 > 0 && volume2) return { volume1: (concentration2 * volume2) / concentration1 };
    if (volume2 === null && volume1) return { volume2: (concentration1 * volume1) / concentration2 };
    return {};
  }, [concentration1, volume1, concentration2, volume2]);

  const resolvedV1 = volume1 ?? dilutionSolve.volume1 ?? null;
  const resolvedV2 = volume2 ?? dilutionSolve.volume2 ?? null;
  const finalConcentration = mode === "hoa-tan" ? concentration : concentration2;
  const finalVolume = mode === "hoa-tan" ? volume : resolvedV2 ?? 0;

  const solutionColor = SOLUTION_COLORS[(compound?.cid ?? 0) % SOLUTION_COLORS.length];
  const opacity = Math.min(0.16 + Math.min(finalConcentration / 2, 1) * 0.74, 0.9);
  const liquidHeight = Math.min(12 + (finalVolume / 1000) * 100, 92);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      {/* Controls */}
      <div className="space-y-6">
        <div className="flex gap-2">
          {([["hoa-tan", "Hòa tan chất rắn"], ["pha-loang", "Pha loãng dung dịch"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                mode === k ? "bg-shu text-white" : "border border-washi/15 text-washi-mo hover:border-washi/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Substance search */}
        <div>
          <p className="chi-muc mb-2 text-shu-sang">Chất tan — khối lượng mol từ PubChem</p>
          <div className="relative">
            <div className="the-khac flex items-center gap-3 rounded-2xl px-4 py-3">
              <Search size={16} className="text-shu-sang" />
              <input
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  if (v.trim().length < 2) setSuggestions([]);
                }}
                onKeyDown={(e) => e.key === "Enter" && void loadCompound(query)}
                placeholder="Nhập tên hoặc công thức: NaOH, glucose, caffeine…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-washi-mo/60"
              />
              {loading && <Loader2 size={16} className="animate-spin text-kin" />}
            </div>
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-washi/12 bg-sumi-nhat shadow-2xl"
                >
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        onClick={() => void loadCompound(s)}
                        className="w-full px-4 py-2.5 text-left text-sm text-washi-mo hover:bg-shu/15 hover:text-washi"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_COMPOUNDS.map((item) => (
              <button
                key={item.name}
                onClick={() => void loadCompound(item.name)}
                className="rounded-full border border-washi/12 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {item.label}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-xs text-shu-sang">{error}</p>}
          {compound && (
            <p className="mt-3 font-mono text-xs text-kin">
              {compound.formula} · M = {compound.molarMass} g/mol · CID {compound.cid} · PubChem
            </p>
          )}
        </div>

        {mode === "hoa-tan" ? (
          <div className="space-y-5">
            <SliderControl label="Nồng độ mục tiêu C" unit="mol/L" min={0.01} max={3} step={0.01}
              value={concentration} displayValue={`${concentration.toFixed(2)} M`} onChange={setConcentration} />
            <SliderControl label="Thể tích dung dịch V" unit="mL" min={25} max={1000} step={5}
              value={volume} displayValue={`${volume} mL`} onChange={setVolume} />
            <div className="the-khac rounded-2xl p-5 font-mono text-sm leading-loose">
              <p className="chi-muc mb-3 text-shu-sang">Sổ tay tính toán · n = m/M</p>
              <p>n = C × V = {concentration.toFixed(2)} mol/L × {(volume / 1000).toFixed(3)} L = <b className="text-washi">{(concentration * volume / 1000).toFixed(4)} mol</b></p>
              <p>m = n × M = {(concentration * volume / 1000).toFixed(4)} × {M ?? "…"} g/mol</p>
              <p className="mt-2 text-xl font-bold text-shu-sang" aria-live="polite">
                Cân {m ? m.toFixed(2) : "…"} g {compound ? formulaWithSubscripts(compound.formula) : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <SliderControl label="Nồng độ gốc C₁" unit="mol/L" min={0.1} max={6} step={0.05}
              value={concentration1} displayValue={`${concentration1.toFixed(2)} M`} onChange={setConcentration1} />
            <SliderControl label="Thể tích gốc lấy ra V₁" unit="mL" min={0} max={1000} step={5}
              value={volume1 ?? 0} displayValue={volume1 === null ? "Ẩn số" : `${volume1} mL`}
              onChange={(x) => setVolume1(x)} isUnknown={volume1 === null} onMarkUnknown={() => setVolume1(null)} />
            <SliderControl label="Nồng độ mong muốn C₂" unit="mol/L" min={0.01} max={6} step={0.01}
              value={concentration2} displayValue={`${concentration2.toFixed(2)} M`} onChange={setConcentration2} />
            <SliderControl label="Thể tích mới V₂" unit="mL" min={0} max={1000} step={5}
              value={volume2 ?? 0} displayValue={volume2 === null ? "Ẩn số" : `${volume2} mL`}
              onChange={(x) => setVolume2(x)} isUnknown={volume2 === null} onMarkUnknown={() => setVolume2(null)} />
            <div className="the-khac rounded-2xl p-5 font-mono text-sm leading-loose">
              <p className="chi-muc mb-3 text-shu-sang">Định luật pha loãng · C₁V₁ = C₂V₂</p>
              <p>{concentration1.toFixed(2)} M × {resolvedV1?.toFixed(1) ?? "?"} mL = {concentration2.toFixed(2)} M × {resolvedV2?.toFixed(1) ?? "?"} mL</p>
              {resolvedV1 !== null && resolvedV2 !== null && (
                <p className="mt-2 text-lg font-bold text-shu-sang" aria-live="polite">
                  Hút {resolvedV1.toFixed(1)} mL dung dịch gốc → định mức nước cất tới {resolvedV2.toFixed(0)} mL
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lab beaker */}
      <div className="the-khac relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl p-6">
        <p className="chu-doc absolute right-5 top-5 text-[10px] text-washi/25">希釈 — pha loãng</p>
        {/* pipette */}
        <div className="relative mb-1 h-16 w-3 rounded-b-full bg-gradient-to-b from-washi/25 to-washi/5">
          <motion.span
            key={`${mode}-${compound?.cid ?? 0}`}
            className="absolute left-1/2 top-14 h-2.5 w-2.5 rounded-full"
            style={{ background: solutionColor, x: "-50%" }}
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

          {/* liquid */}
          <g clipPath="url(#cat-coc)">
            <motion.rect
              x={60}
              width={100}
              fill={solutionColor}
              initial={false}
              animate={{ y: 210 - (liquidHeight / 100) * 160 - 24, height: (liquidHeight / 100) * 160 + 34, opacity: opacity }}
              transition={{ type: "spring", stiffness: 42, damping: 13 }}
            />
            <ellipse cx="110" cy="0" rx="10" ry="10" fill="none" />
          </g>

          {/* graduation marks */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <g key={ratio} opacity={0.4}>
              <line x1={146} x2={154} y1={178 - ratio * 140} y2={178 - ratio * 140} stroke="#f2ead9" strokeWidth="1" />
              <text x={158} y={182 - ratio * 140} fontSize="8" fill="#f2ead9" fontFamily="var(--font-mono)">
                {ratio * 1000} mL
              </text>
            </g>
          ))}

          {/* beaker body */}
          <path
            d="M60 30 L60 170 Q60 190 80 190 L140 190 Q160 190 160 170 L160 30 M52 30 L74 30 M146 30 L168 30"
            fill="none" stroke="rgba(242,234,217,0.75)" strokeWidth="2.4" strokeLinecap="round"
          />
        </svg>

        <div className="mt-2 flex items-center gap-3 text-center">
          <Droplets size={16} style={{ color: solutionColor }} />
          <p className="font-mono text-sm text-washi">
            {formulaWithSubscripts(compound?.formula)} · {finalConcentration.toFixed(2)} M · độ đậm ∝ nồng độ
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

function SliderControl({
  label, unit, value, min, max, step, displayValue, onChange, isUnknown, onMarkUnknown,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  isUnknown?: boolean;
  onMarkUnknown?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm text-washi-mo">
          {label} <span className="font-mono text-[10px] text-washi-mo/60">({unit})</span>
        </p>
        <div className="flex items-center gap-3">
          {onMarkUnknown && (
            <button
              onClick={onMarkUnknown}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] transition-colors ${
                isUnknown ? "bg-kin text-sumi" : "border border-washi/20 text-washi-mo hover:border-kin/60"
              }`}
            >
              <RefreshCcw size={10} /> đặt làm ẩn
            </button>
          )}
          <span className={`font-mono text-lg font-semibold tabular-nums ${isUnknown ? "text-kin" : "text-shu-sang"}`}>
            {displayValue}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={isUnknown}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-ew-resize disabled:opacity-30"
        aria-label={label}
        aria-valuetext={isUnknown ? "Ẩn số — tính từ các giá trị khác" : displayValue}
      />
    </div>
  );
}
