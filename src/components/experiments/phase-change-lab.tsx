"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Snowflake, Waves, Wind } from "lucide-react";
import type { ElementInfo } from "@/lib/pubchem";
import { usePrefersReducedMotion } from "@/lib/use-motion";
import { useDataSaverMode } from "@/components/data-saver-mode";
import { deltaHVaporizationKJMol, liquidGasBoundaryCurve, boilingPointFromPressure } from "@/lib/chemistry/phase-diagram";

interface Particle {
  x: number; y: number; vx: number; vy: number; gx: number; gy: number;
}

/** Particle system: solid vibrates around a crystal lattice, liquid drifts via Brownian motion, gas flies freely */
function useParticleMotion(particleCount: number, stateOfMatter: "ran" | "long" | "khi", vibration: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const config = useRef({ stateOfMatter: "ran" as "ran" | "long" | "khi", vibration: 0.4 });
  const reducedMotion = usePrefersReducedMotion();

  // Update the particle-motion config right inside the hook that owns this ref —
  // avoids mutating a value handed back out to the calling component (react-hooks/immutability).
  useEffect(() => {
    config.current.stateOfMatter = stateOfMatter;
    config.current.vibration = vibration;
  }, [stateOfMatter, vibration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const frame = { w: 0, h: 0 };

    const layoutParticles = () => {
      const cols = Math.ceil(Math.sqrt(particleCount * (frame.w / Math.max(frame.h, 1))));
      const rows = Math.ceil(particleCount / cols);
      const bx = frame.w / (cols + 1);
      const by = (frame.h * 0.72) / (rows + 1);
      particles.current = Array.from({ length: particleCount }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const gx = bx * (c + 1);
        const gy = frame.h * 0.24 + by * (r + 1);
        return { x: gx, y: gy, gx, gy, vx: 0, vy: 0 };
      });
    };

    // Draws a single static frame at the base grid position (gx, gy) — used
    // under prefers-reduced-motion to avoid a continuous sin/cos oscillation.
    const drawStatic = () => {
      ctx.clearRect(0, 0, frame.w, frame.h);
      for (const h of particles.current) {
        ctx.beginPath();
        ctx.arc(h.gx, h.gy, 4.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(242,234,217,0.92)";
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(214,59,31,0.55)";
        ctx.stroke();
      }
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      frame.w = rect.width;
      frame.h = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutParticles();
      if (reducedMotion) drawStatic();
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    if (reducedMotion) {
      // No need to observe visibility/run a loop — just one static frame.
      return () => {
        resizeObserver.disconnect();
      };
    }

    const visibilityObserver = new IntersectionObserver(([e]) => (running = e.isIntersecting));
    visibilityObserver.observe(canvas);

    let t = 0;
    const draw = () => {
      t += 1;
      if (running) {
        ctx.clearRect(0, 0, frame.w, frame.h);
        const { stateOfMatter, vibration } = config.current;
        for (let i = 0; i < particles.current.length; i++) {
          const h = particles.current[i];
          if (stateOfMatter === "ran") {
            h.x = h.gx + Math.sin(t * 0.09 * (1 + vibration * 3) + i * 1.7) * (0.7 + vibration * 2.4);
            h.y = h.gy + Math.cos(t * 0.11 * (1 + vibration * 3) + i * 2.3) * (0.7 + vibration * 2.4);
          } else if (stateOfMatter === "long") {
            h.vx += (Math.sin(t * 0.02 + i * 12.9898) * 43758.5453 % 1) * 0.06;
            h.vy += (Math.cos(t * 0.017 + i * 7.233) * 24634.6345 % 1) * 0.06 + 0.012;
            h.vx *= 0.95; h.vy *= 0.95;
            h.x += h.vx; h.y += h.vy;
            if (h.y > frame.h - 8) { h.y = frame.h - 8; h.vy *= -0.4; }
            if (h.y < frame.h * 0.55) { h.y = frame.h * 0.55; h.vy *= -0.4; }
            if (h.x < 6 || h.x > frame.w - 6) h.vx *= -1;
            h.x = Math.min(Math.max(h.x, 6), frame.w - 6);
          } else {
            if (h.vx === 0 && h.vy === 0) {
              h.vx = (Math.sin(i * 91.7) * 2.4) || 1;
              h.vy = (Math.cos(i * 47.3) * 2.4) || -1;
            }
            h.x += h.vx * 2.6; h.y += h.vy * 2.6;
            if (h.x < 5 || h.x > frame.w - 5) h.vx *= -1;
            if (h.y < 5 || h.y > frame.h - 5) h.vy *= -1;
          }
          ctx.beginPath();
          ctx.arc(h.x, h.y, 4.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(242,234,217,0.92)";
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "rgba(214,59,31,0.55)";
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [particleCount, reducedMotion]);

  return { canvasRef };
}

const STATE_ICONS = {
  ran: { label: "RẮN", icon: Snowflake, color: "#9db4d8" },
  long: { label: "LỎNG", icon: Waves, color: "#3d8fae" },
  khi: { label: "KHÍ", icon: Wind, color: "#d63b1f" },
} as const;

export default function PhaseChangeLab({ elements }: { elements: ElementInfo[] }) {
  const elementsWithFullData = useMemo(
    () => elements.filter((n) => n.meltingPointK !== null && n.boilingPointK !== null && n.boilingPointK > n.meltingPointK),
    [elements],
  );
  const fullDataNumbers = useMemo(() => new Set(elementsWithFullData.map((n) => n.atomicNumber)), [elementsWithFullData]);
  const [selectedNumber, setSelectedNumber] = useState(26); // Iron
  const nt = elementsWithFullData.find((n) => n.atomicNumber === selectedNumber) ?? elementsWithFullData[0];

  // Pressure: slides on a log scale (logPressure ∈ [-2, 2] ⇒ 0.01–100 atm), defaults to 1 atm.
  const [logPressure, setLogPressure] = useState(0);
  const atmPressure = 10 ** logPressure;
  const deltaHVap = nt ? deltaHVaporizationKJMol(nt.atomicNumber) : null;
  const hasVaporizationData = deltaHVap !== null;
  // EFFECTIVE boiling point at the current pressure: the exact PubChem measurement
  // at 1 atm; derived via Clausius-Clapeyron when pressure changes AND ΔH_vap is
  // available; if ΔH_vap is unavailable, keep the 1 atm value and flag it as
  // "undetermined" (never guessed).
  const effectiveBoilingK =
    nt?.boilingPointK == null
      ? null
      : atmPressure !== 1 && hasVaporizationData
        ? boilingPointFromPressure(deltaHVap!, nt.boilingPointK, atmPressure)
        : nt.boilingPointK;

  const maxTemperature = Math.ceil((effectiveBoilingK ?? nt?.boilingPointK ?? 3600) * 1.1);
  const [temperature, setTemperature] = useState(300);

  // Element change → reset starting temperature + pressure back to 1 atm. Adjusts
  // state on the selection change, directly during render rather than in an effect
  // (React's official pattern for this).
  const [previousNumber, setPreviousNumber] = useState(nt?.atomicNumber);
  if (nt && nt.atomicNumber !== previousNumber) {
    setPreviousNumber(nt.atomicNumber);
    setTemperature(Math.round(Math.min(300, maxTemperature * 0.5)));
    setLogPressure(0);
  }

  const stateOfMatter: "ran" | "long" | "khi" = !nt
    ? "ran"
    : temperature < (nt.meltingPointK ?? 0)
      ? "ran"
      : temperature < (effectiveBoilingK ?? 0)
        ? "long"
        : "khi";
  const vibration = Math.min(temperature / Math.max(nt?.meltingPointK ?? 1, 1), 2);

  const [dataSaver] = useDataSaverMode();
  const particleCount = dataSaver ? 24 : 96;
  const { canvasRef } = useParticleMotion(particleCount, stateOfMatter, vibration);

  const StateIcon = STATE_ICONS[stateOfMatter].icon;
  const toCelsius = (k: number) => `${(k - 273.15).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} °C`;
  const formatAtm = (a: number) => (a < 1 ? a.toFixed(2) : a < 10 ? a.toFixed(1) : Math.round(a).toString());

  // P-T diagram: horizontal axis Temperature 0–5000 K (linear), vertical axis
  // Pressure 0.01–100 atm (log). Hand-rolled SVG, same convention as the
  // titration curve in titration-lab.tsx (useMemo path string + viewBox).
  const PT_MIN_ATM = 0.01;
  const PT_MAX_ATM = 100;
  const PT_MAX_K = 5000;
  const phaseDiagram = useMemo(() => {
    const W = 460, H = 260, PL = 46, PR = 14, PT = 14, PB = 30;
    const logMin = Math.log10(PT_MIN_ATM);
    const logMax = Math.log10(PT_MAX_ATM);
    const xFromTemp = (t: number) => PL + (Math.min(Math.max(t, 0), PT_MAX_K) / PT_MAX_K) * (W - PL - PR);
    const yFromPressure = (p: number) => {
      const logP = Math.log10(Math.min(Math.max(p, PT_MIN_ATM), PT_MAX_ATM));
      return PT + (1 - (logP - logMin) / (logMax - logMin)) * (H - PT - PB);
    };
    const boilingCurve =
      hasVaporizationData && nt?.boilingPointK != null
        ? liquidGasBoundaryCurve(deltaHVap!, nt.boilingPointK, PT_MIN_ATM, PT_MAX_ATM, 60)
        : [];
    const boilingPath = boilingCurve
      .map((d, i) => `${i === 0 ? "M" : "L"}${xFromTemp(d.temperatureK).toFixed(1)},${yFromPressure(d.pressureAtm).toFixed(1)}`)
      .join(" ");
    return { W, H, PL, PR, PT, PB, xFromTemp, yFromPressure, boilingPath };
  }, [hasVaporizationData, deltaHVap, nt]);

  const { W, H, PL, PR, PT, PB, xFromTemp, yFromPressure, boilingPath } = phaseDiagram;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Observation chamber */}
      <div className="the-khac relative overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-0">
          <div>
            <p className="chi-muc text-shu-sang">Buồng vi hạt · 相転移</p>
            <h3 className="mt-1 font-display text-2xl font-bold">
              {nt?.vietnameseName} <span className="text-shu-sang">{nt?.symbol}</span>
            </h3>
          </div>
          <div className="text-right" aria-live="polite">
            <p className="font-mono text-4xl font-bold tabular-nums" style={{ color: STATE_ICONS[stateOfMatter].color }}>
              {temperature.toLocaleString("vi-VN")} K
            </p>
            <p className="chi-muc flex items-center justify-end gap-1.5 text-washi-mo">
              <StateIcon size={12} /> {STATE_ICONS[stateOfMatter].label}
            </p>
          </div>
        </div>

        <canvas ref={canvasRef} className="mt-2 h-[340px] w-full" aria-label="Mô phỏng chuyển động hạt" />

        <div className="p-6 pt-2">
          <input
            type="range" min={0} max={maxTemperature} step={1} value={Math.min(temperature, maxTemperature)}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full cursor-ew-resize" aria-label="Nhiệt độ buồng (Kelvin)"
            aria-valuetext={`${temperature.toLocaleString("vi-VN")} kelvin, ${toCelsius(temperature)}, trạng thái ${STATE_ICONS[stateOfMatter].label.toLowerCase()}`}
          />
          {/* Phase-transition ruler */}
          <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-[#7fa0d8] via-[#c9a35a] to-[#d63b1f]">
            {nt && (
              <>
                <span
                  className="absolute -top-1 h-4 w-[3px] rounded bg-washi"
                  style={{ left: `${((nt.meltingPointK ?? 0) / maxTemperature) * 100}%` }}
                  title={`Nóng chảy ${nt.meltingPointK} K`}
                />
                <span
                  className="absolute -top-1 h-4 w-[3px] rounded bg-shu-sang"
                  style={{ left: `${((effectiveBoilingK ?? 0) / maxTemperature) * 100}%` }}
                  title={`Sôi ${(effectiveBoilingK ?? 0).toFixed(1)} K ở ${formatAtm(atmPressure)} atm`}
                />
                <span
                  className="absolute -top-5 -translate-x-1/2 font-mono text-[9px] text-washi-mo"
                  style={{ left: `${((nt.meltingPointK ?? 0) / maxTemperature) * 100}%` }}
                >
                  nóng chảy
                </span>
                <span
                  className="absolute -top-5 -translate-x-1/2 font-mono text-[9px] text-shu-sang"
                  style={{ left: `${((effectiveBoilingK ?? 0) / maxTemperature) * 100}%` }}
                >
                  sôi
                </span>
              </>
            )}
          </div>

          {/* Chamber pressure */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-washi-mo">
              <span>Áp suất buồng</span>
              <span className="font-mono font-semibold text-washi">{formatAtm(atmPressure)} atm</span>
            </div>
            <input
              type="range" min={-2} max={2} step={0.02} value={logPressure}
              onChange={(e) => setLogPressure(Number(e.target.value))}
              className="w-full cursor-ew-resize" aria-label="Áp suất buồng (atm, thang log)"
              aria-valuetext={`${formatAtm(atmPressure)} atm`}
            />
            {!hasVaporizationData && atmPressure !== 1 && (
              <p className="mt-1.5 text-[10px] text-kin">
                Chưa xác định: {nt?.vietnameseName} không có ΔH hóa hơi đã ghim — điểm sôi hiển thị vẫn là số đo ở 1 atm.
              </p>
            )}
          </div>

          <p className="mt-4 text-center font-mono text-[11px] text-washi-mo">
            Trượt nhiệt độ và áp suất — điểm sôi dịch chuyển theo phương trình Clausius-Clapeyron; điểm nóng
            chảy giữ xấp xỉ không đổi (ranh giới rắn-lỏng gần như thẳng đứng trong khoảng áp suất này).
          </p>
        </div>
      </div>

      {/* Element selector + data */}
      <div className="space-y-6">
        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-3 text-shu-sang">Nguyên tố trong buồng</p>
          <div className="relative">
            <select
              value={selectedNumber}
              onChange={(e) => setSelectedNumber(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-washi/15 bg-sumi-nhat px-4 py-3 text-sm outline-none transition-colors focus:border-shu-sang"
              aria-label="Chọn nguyên tố"
            >
              {elements.map((n) => {
                const hasFullData = fullDataNumbers.has(n.atomicNumber);
                return (
                  <option key={n.atomicNumber} value={n.atomicNumber} disabled={!hasFullData} className="bg-sumi-nhat">
                    {n.atomicNumber}. {n.vietnameseName} ({n.symbol})
                    {!hasFullData && " — PubChem chưa có điểm nóng chảy/sôi đo được"}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-washi-mo" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-washi-mo">
            {elementsWithFullData.length}/{elements.length} nguyên tố có đủ số liệu nóng chảy &amp; sôi đo được từ PubChem, mô
            phỏng được trong buồng. {elements.length - elementsWithFullData.length} nguyên tố còn lại (chủ yếu là siêu nặng
            tổng hợp) hiện trong danh sách nhưng bị khoá chọn — chưa từng được đo ở trạng thái khối.
          </p>
        </div>

        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-4 text-shu-sang">Giản đồ pha P-T · {nt?.vietnameseName}</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Giản đồ pha áp suất theo nhiệt độ">
            {[0.01, 0.1, 1, 10, 100].map((p) => (
              <g key={p}>
                <line x1={PL} x2={W - PR} y1={yFromPressure(p)} y2={yFromPressure(p)} stroke="rgba(242,234,217,0.07)" />
                <text x={PL - 6} y={yFromPressure(p) + 3} fontSize="9" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
                  {p}
                </text>
              </g>
            ))}
            {[0, 1000, 2000, 3000, 4000, 5000].map((t) => (
              <text key={t} x={xFromTemp(t)} y={H - PB + 16} fontSize="9" textAnchor="middle" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
                {t}
              </text>
            ))}
            {nt?.meltingPointK != null && (
              <line
                x1={xFromTemp(nt.meltingPointK)} x2={xFromTemp(nt.meltingPointK)} y1={PT} y2={H - PB}
                stroke="#7fa0d8" strokeDasharray="3 4" strokeOpacity={0.65}
              />
            )}
            {boilingPath && <path d={boilingPath} fill="none" stroke="#d63b1f" strokeWidth={2} strokeLinecap="round" />}
            <circle cx={xFromTemp(temperature)} cy={yFromPressure(atmPressure)} r={5} fill={STATE_ICONS[stateOfMatter].color} stroke="#0b0a08" strokeWidth={2} />
            <text x={PL} y={12} fontSize="9" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">atm</text>
            <text x={W - PR} y={H - 4} fontSize="9" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">K</text>
          </svg>
          <p className="mt-3 text-[11px] leading-relaxed text-washi-mo">
            {hasVaporizationData
              ? "Đường đỏ: ranh giới lỏng-khí thật, tính từ ΔH hóa hơi đã ghim (CRC/Lange's) qua Clausius-Clapeyron. "
              : "Chưa có ΔH hóa hơi đã ghim cho nguyên tố này — không vẽ được đường ranh giới lỏng-khí. "}
            Đường xanh đứt: điểm nóng chảy (xấp xỉ, coi như không đổi theo áp suất). Chấm tròn: trạng thái buồng hiện tại.
          </p>
        </div>

        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-4 text-shu-sang">Sổ liệu thật · {nt?.vietnameseName}</p>
          <dl className="space-y-3 font-mono text-sm">
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Điểm nóng chảy</dt>
              <dd className="text-right tabular-nums">{nt?.meltingPointK} K · {nt ? toCelsius(nt.meltingPointK ?? 0) : ""}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Điểm sôi ({formatAtm(atmPressure)} atm)</dt>
              <dd className="text-right tabular-nums">
                {effectiveBoilingK != null ? effectiveBoilingK.toFixed(1) : nt?.boilingPointK} K · {nt ? toCelsius(effectiveBoilingK ?? nt.boilingPointK ?? 0) : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Khối lượng riêng</dt>
              <dd className="text-right tabular-nums">{nt?.density ?? "—"} g/cm³</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-washi-mo">Trạng thái chuẩn (STP)</dt>
              <dd className="text-right tabular-nums">
                {nt?.stateCertainty === "du-doan" ? "Dự đoán: " : ""}
                {nt?.rawState}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-kin/25 bg-kin/5 p-5 text-xs leading-relaxed text-kin">
          Mô phỏng cấp khái niệm: hạt là nét minh họa; mốc nóng chảy/sôi ở 1 atm và ΔH hóa hơi hoàn toàn là số
          liệu đo thực nghiệm (PubChem PUG-REST · CRC Handbook of Chemistry and Physics / Lange&apos;s Handbook of
          Chemistry). Đường ranh giới lỏng-khí ở áp suất khác 1 atm là kết quả TÍNH bằng Clausius-Clapeyron
          trên số liệu đó, không phải số đo trực tiếp.
        </div>
      </div>
    </div>
  );
}
