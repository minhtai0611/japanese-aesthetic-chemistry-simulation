"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom, Check, Copy, ExternalLink, Loader2, Orbit, Pause, Ruler, RotateCw, Search,
} from "lucide-react";
import type { Compound, Compound3D } from "@/lib/pubchem";
import type { MeasurementResult } from "@/lib/measurement-geometry";
import { FEATURED_COMPOUNDS } from "@/lib/featured-compounds";
import { slugifyCompound } from "@/lib/slug";
import { usePrefersReducedMotion } from "@/lib/use-motion";
import { useDataSaverMode } from "@/components/data-saver-mode";
import { Molecule2D, useWebGLSupport } from "@/components/three-d/molecule-2d";
import { useIntersectionObserver } from "@/components/three-d/lazy-canvas-wrapper";
import { useElementColorMap } from "@/components/three-d/molecule-surface";

const CompoundScene = dynamic(() => import("@/components/three-d/compound-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <Loader2 className="animate-spin text-shu-sang" size={28} />
    </div>
  ),
});

function withSubscripts(cf: string | null) {
  if (!cf) return "—";
  return cf.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>));
}

export default function Viewer3D({
  initialName = "caffeine",
  initialProperties = null,
  initial3D = null,
}: {
  initialName?: string;
  initialProperties?: Compound | null;
  initial3D?: Compound3D | null;
}) {
  const [query, setQuery] = useState(initialName);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [properties, setProperties] = useState<Compound | null>(initialProperties);
  const [data3D, setData3D] = useState<Compound3D | null>(initial3D);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reducedMotion = usePrefersReducedMotion();
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [dataSaver] = useDataSaverMode();
  const webglSupported = useWebGLSupport();
  // Data-saver mode or a device without WebGL → use the 2D SVG diagram instead of the 3D canvas.
  const use2D = dataSaver || !webglSupported;
  // In use2D: stay on 2D permanently. Otherwise: only switch to the 3D canvas when
  // this area enters the viewport OR the user manually taps the activation button.
  const { ref: canvasFrameRef, isVisible } = useIntersectionObserver();
  const [manuallyActivated, setManuallyActivated] = useState(false);
  const show3D = !use2D && (isVisible || manuallyActivated);
  const colorMap = useElementColorMap();
  const [enhancedEnabled, setEnhancedEnabled] = useState(false);
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult>(null);

  const load = useCallback(async (name: string) => {
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/compound/${encodeURIComponent(q)}`),
        fetch(`/api/compound/${encodeURIComponent(q)}/3d`),
      ]);
      if (!r2.ok) throw new Error("no 3D data");
      setProperties(r1.ok ? ((await r1.json()) as Compound) : null);
      setData3D((await r2.json()) as Compound3D);
      setQuery(q);
      // Update the address bar to this compound's real permalink — only change the
      // displayed URL (History API), do NOT trigger a Next.js navigation, so the
      // running 3D canvas is preserved (avoids re-breaking the "context loss" fix
      // that happens when the canvas remounts on every change).
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/compound/${slugifyCompound(q)}`);
      }
    } catch {
      setError(`PubChem không có mô hình 3D cho “${q}” — thử tên tiếng Anh (vd: caffeine, glucose).`);
      setData3D(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggestions?q=${encodeURIComponent(q)}`);
        if (r.ok) setSuggestions(await r.json());
      } catch { /* ignore */ }
    }, 260);
  }, [query]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <div className="the-khac nut-vien flex items-center gap-3 rounded-2xl px-5 py-4">
            <Search size={19} className="shrink-0 text-shu-sang" />
            <input
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (v.trim().length < 2) setSuggestions([]);
              }}
              onKeyDown={(e) => e.key === "Enter" && void load(query)}
              placeholder="Tìm hợp chất trên PubChem: caffeine, vitamin c, paracetamol…"
              className="w-full bg-transparent outline-none placeholder:text-washi-mo/60"
              aria-label="Tìm hợp chất hóa học"
            />
            {loading && <Loader2 size={18} className="animate-spin text-kin" />}
          </div>
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-washi/12 bg-sumi-nhat shadow-2xl"
              >
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => void load(s)}
                      className="w-full px-5 py-3 text-left text-sm text-washi-mo hover:bg-shu/15 hover:text-washi"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {FEATURED_COMPOUNDS.map((c) => (
            <button
              key={c.name}
              onClick={() => void load(c.name)}
              className="rounded-full border border-washi/12 px-3.5 py-1.5 text-xs text-washi-mo transition-all hover:-translate-y-0.5 hover:border-shu-sang hover:text-shu-sang"
            >
              {c.label}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-center text-sm text-shu-sang">{error}</p>}
      </div>

      {/* Molecule stage */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div ref={canvasFrameRef} className="the-khac relative h-[440px] overflow-hidden rounded-3xl sm:h-[540px]">
          <p className="chu-doc absolute left-5 top-6 z-10 text-[10px] text-washi/25">分子 — phân tử</p>
          {data3D ? (
            show3D ? (
              <CompoundScene
                data={data3D}
                autoRotate={autoRotate}
                enhancedEnabled={enhancedEnabled}
                onMeasurementChange={setMeasurementResult}
              />
            ) : (
              <div className="absolute inset-0 p-8">
                <Molecule2D data={data3D} />
              </div>
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-washi-mo">
              <div className="text-center">
                <Atom size={40} className="mx-auto mb-3 text-washi/20" />
                <p className="text-sm">{loading ? "Đang truy vấn PubChem…" : "Chọn một hợp chất để dựng mô hình 3D"}</p>
              </div>
            </div>
          )}
          {data3D && use2D && (
            <p className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-[10px] text-washi-mo backdrop-blur">
              {dataSaver ? "Chế độ tiết kiệm: sơ đồ 2D thay mô hình 3D" : "Máy không hỗ trợ WebGL: sơ đồ 2D chiếu trực giao"}
            </p>
          )}
          {data3D && !use2D && !show3D && (
            <button
              onClick={() => setManuallyActivated(true)}
              className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs text-washi-mo backdrop-blur transition-colors hover:border-shu-sang hover:text-washi"
            >
              Bật tương tác 3D xoay chiều
            </button>
          )}
          {data3D && show3D && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setAutoRotate((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs backdrop-blur transition-colors hover:border-shu-sang"
              >
                {autoRotate ? <Pause size={13} /> : <RotateCw size={13} />}
                {autoRotate ? "Dừng xoay" : "Tự xoay"}
              </button>
              <button
                onClick={() => {
                  setEnhancedEnabled((v) => !v);
                  // Turning off enhanced mode → also clear the old measurement result,
                  // to avoid displaying a value that looks "still valid" while the tool is off.
                  setMeasurementResult(null);
                }}
                className="flex items-center gap-2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs backdrop-blur transition-colors hover:border-shu-sang"
              >
                <Ruler size={13} />
                {enhancedEnabled ? "Tắt bề mặt VDW & đo lường" : "Bật bề mặt VDW & đo lường"}
              </button>
              <span className="hidden rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-[10px] text-washi-mo backdrop-blur sm:block">
                Kéo để xoay · cuộn để phóng
              </span>
            </div>
          )}
          {enhancedEnabled && show3D && (
            <p className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full border border-washi/15 bg-sumi/70 px-3 py-1 text-[10px] text-washi-mo backdrop-blur">
              Nhấp 2 nguyên tử để đo khoảng cách (Å) · nhấp thêm 1 để đo góc liên kết (°)
            </p>
          )}
        </div>

        {/* Real properties */}
        <div className="space-y-4">
          <div className="the-khac rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="chi-muc text-shu-sang">Hồ sơ PubChem</h2>
                <p className="mt-2 font-display text-3xl font-bold">
                  {properties ? withSubscripts(properties.formula) : "—"}
                </p>
                <p className="mt-1 break-words font-mono text-[11px] text-washi-mo">
                  CID {properties?.cid ?? data3D?.cid ?? "…"} · {properties?.iupac ?? ""}
                </p>
              </div>
              {properties && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${properties.cid}`}
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
                ["Khối lượng mol", properties?.molarMass != null ? `${properties.molarMass} g/mol` : "—"],
                ["Khối lượng chính xác", properties?.exactMass != null ? `${properties.exactMass} u` : "—"],
                ["logP (XLogP3)", properties?.xLogP != null ? String(properties.xLogP) : "—"],
                ["Diện tích phân cực TPSA", properties?.tpsa != null ? `${properties.tpsa} Å²` : "—"],
                ["Cho liên kết H", properties?.hbd != null ? String(properties.hbd) : "—"],
                ["Nhận liên kết H", properties?.hba != null ? String(properties.hba) : "—"],
                ["Liên kết xoay được", properties?.rotatableBonds != null ? String(properties.rotatableBonds) : "—"],
                ["Độ phức tạp", properties?.complexity != null ? String(properties.complexity) : "—"],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-washi/8 bg-washi/[0.03] p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-washi-mo">{label}</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-washi">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {measurementResult && (
            <div className="the-khac rounded-2xl p-4" aria-live="polite">
              <p className="chi-muc text-shu-sang">Kết quả đo lường 3D</p>
              <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-washi">
                {measurementResult.kind === "khoangCach"
                  ? `d(#${measurementResult.a + 1}–#${measurementResult.b + 1}) = ${measurementResult.angstrom.toFixed(3)} Å`
                  : `∠(#${measurementResult.a + 1}–#${measurementResult.b + 1}–#${measurementResult.c + 1}) = ${measurementResult.degrees.toFixed(1)}°`}
              </p>
            </div>
          )}

          {properties?.smiles && (
            <div className="the-khac rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="chi-muc text-kin">SMILES chuẩn</p>
                <button
                  onClick={() => void copyToClipboard(properties.smiles ?? "")}
                  className="flex items-center gap-1.5 rounded-full border border-washi/15 px-3 py-1 text-[11px] text-washi-mo transition-colors hover:border-kin hover:text-kin"
                >
                  {copied ? <Check size={12} className="text-tokiwa" /> : <Copy size={12} />}
                  {copied ? "Đã sao chép" : "Sao chép"}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-sm leading-relaxed text-washi">{properties.smiles}</p>
            </div>
          )}

          <p className="flex items-start gap-2 rounded-2xl border border-washi/8 p-4 text-[11px] leading-relaxed text-washi-mo">
            <Orbit size={14} className="mt-0.5 shrink-0 text-shu-sang" />
            Tọa độ nguyên tử &amp; bậc liên kết lấy từ conformer 3D thực nghiệm/tính toán của PubChem
            (record_type=3d). Màu nguyên tử theo quy ước CPK của chính PubChem.
          </p>
        </div>
      </div>

      {data3D && (
        <details className="the-khac mt-6 rounded-2xl p-5">
          <summary className="cursor-pointer text-sm text-washi-mo">
            Xem dữ liệu phân tử dạng bảng (thay thế cho mô hình 3D)
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Danh sách nguyên tử của {data3D.queryName}</caption>
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
                {data3D.atoms.map((nt, i) => (
                  <tr key={i} className="border-b border-washi/5 font-mono text-xs">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-washi-mo">{i + 1}</th>
                    <td className="py-1.5 pr-3">
                      {colorMap?.get(nt.atomicNumber)?.symbol ?? nt.atomicNumber} · {colorMap?.get(nt.atomicNumber)?.vietnameseName ?? "?"}
                    </td>
                    <td className="py-1.5 pr-3">{nt.x.toFixed(3)}</td>
                    <td className="py-1.5 pr-3">{nt.y.toFixed(3)}</td>
                    <td className="py-1.5">{nt.z.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data3D.bonds.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Danh sách liên kết của {data3D.queryName}</caption>
                <thead>
                  <tr className="border-b border-washi/10 text-left text-[10px] uppercase tracking-wider text-washi-mo">
                    <th scope="col" className="py-2 pr-3 font-normal">Nguyên tử A</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Nguyên tử B</th>
                    <th scope="col" className="py-2 font-normal">Bậc liên kết</th>
                  </tr>
                </thead>
                <tbody>
                  {data3D.bonds.map((lk, i) => (
                    <tr key={i} className="border-b border-washi/5 font-mono text-xs">
                      <td className="py-1.5 pr-3">#{lk.a + 1}</td>
                      <td className="py-1.5 pr-3">#{lk.b + 1}</td>
                      <td className="py-1.5">{lk.order}</td>
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
