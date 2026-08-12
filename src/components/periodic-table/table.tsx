"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Info } from "lucide-react";
import type { ElementInfo } from "@/lib/pubchem";
import { BLOCK_COLORS, BLOCK_LABELS, type ElementBlock } from "@/lib/element";

const BLOCKS: (ElementBlock | "tat")[] = ["tat", "s", "p", "d", "f"];
const STATES = [
  { key: "tat", label: "Tất cả" },
  { key: "ran", label: "Rắn" },
  { key: "long", label: "Lỏng" },
  { key: "khi", label: "Khí" },
  { key: "chua-xac-dinh", label: "Siêu tổng hợp" },
] as const;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export default function InteractivePeriodicTable({ elements }: { elements: ElementInfo[] }) {
  const [query, setQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<ElementBlock | "tat">("tat");
  const [selectedState, setSelectedState] = useState<string>("tat");

  const matchedNumbers = useMemo(() => {
    const t = normalize(query.trim());
    return new Set(
      elements
        .filter((n) => {
          if (selectedBlock !== "tat" && n.block !== selectedBlock) return false;
          if (selectedState !== "tat" && n.stateOfMatter !== (selectedState as ElementInfo["stateOfMatter"])) return false;
          if (!t) return true;
          return (
            normalize(n.vietnameseName).includes(t) ||
            normalize(n.englishName).includes(t) ||
            normalize(n.symbol).includes(t) ||
            String(n.atomicNumber) === t
          );
        })
        .map((n) => n.atomicNumber),
    );
  }, [elements, query, selectedBlock, selectedState]);

  const isFiltering = query.trim() !== "" || selectedBlock !== "tat" || selectedState !== "tat";

  const byCoordinate = useMemo(() => {
    const m = new Map<string, ElementInfo>();
    for (const n of elements) m.set(`${n.displayPeriod}-${n.group}`, n);
    return m;
  }, [elements]);

  const GROUPS = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 1), []);

  const renderElementCell = (group: number, n: ElementInfo | undefined) => {
    if (!n) return <td key={group} />;
    const visible = !isFiltering || matchedNumbers.has(n.atomicNumber);
    return (
      <td key={group} className="p-0">
        <motion.div
          layout={false}
          animate={{ opacity: visible ? 1 : 0.12, scale: visible ? 1 : 0.86 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href={`/element/${n.symbol.toLowerCase()}`}
            title={`${n.vietnameseName} (${n.symbol}) — Z = ${n.atomicNumber}${n.stateCertainty === "du-doan" ? " — trạng thái dự đoán, chưa đo trực tiếp" : ""}`}
            className="group relative block aspect-square min-h-11 min-w-11 overflow-hidden rounded-[7px] border px-1.5 pt-1 transition-transform duration-300 hover:z-10 hover:scale-[1.25] hover:shadow-[0_8px_30px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: `${BLOCK_COLORS[n.block]}66`,
              background: `linear-gradient(155deg, ${BLOCK_COLORS[n.block]}2e, #12100c 70%)`,
            }}
          >
            <span className="block text-[9px] leading-none text-washi-mo/80 tabular-nums">
              {n.atomicNumber}
              {n.stateCertainty === "du-doan" && (
                <span className="text-kin" aria-hidden>
                  {" "}*
                </span>
              )}
            </span>
            <span
              className="mt-0.5 block font-display text-[15px] font-bold leading-none sm:text-base"
              style={{ color: BLOCK_COLORS[n.block] }}
            >
              {n.symbol}
            </span>
            <span className="mt-1 block truncate text-[8.5px] leading-tight text-washi-mo">
              {n.vietnameseName}
            </span>
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
              style={{ background: BLOCK_COLORS[n.block] }}
            />
          </Link>
        </motion.div>
      </td>
    );
  };

  return (
    <div>
      <h2 className="sr-only">Bảng tuần hoàn tương tác</h2>
      {/* Filter tools */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="the-khac flex max-w-md flex-1 items-center gap-3 rounded-2xl px-4 py-3">
          <Search size={18} className="shrink-0 text-shu-sang" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, ký hiệu, số hiệu… (vd: vàng, O2, 79)"
            className="w-full bg-transparent text-sm text-washi outline-none placeholder:text-washi-mo/60"
            aria-label="Tìm kiếm nguyên tố"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {BLOCKS.map((block) => (
            <button
              key={block}
              onClick={() => setSelectedBlock(block)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedBlock === block
                  ? "border-transparent text-sumi"
                  : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
              }`}
              style={selectedBlock === block ? { background: block === "tat" ? "#f2ead9" : BLOCK_COLORS[block], color: "#0b0a08" } : {}}
            >
              {block === "tat" ? "Tất cả" : BLOCK_LABELS[block]}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-washi/15 sm:block" />
          {STATES.map((state) => (
            <button
              key={state.key}
              onClick={() => setSelectedState(state.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedState === state.key
                  ? "border-transparent bg-kin text-sumi"
                  : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
              }`}
            >
              {state.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto pb-4 [-webkit-overflow-scrolling:touch]">
        <table className="min-w-[1080px] border-separate border-spacing-1.5">
          <caption className="sr-only">
            Bảng tuần hoàn 118 nguyên tố hóa học, sắp xếp theo chu kỳ (hàng) và nhóm (cột 1 đến 18).
            Họ Lantan (57–71) và họ Actini (89–103) hiển thị ở hai hàng riêng dưới bảng chính.
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Chu kỳ</span>
              </th>
              {GROUPS.map((g) => (
                <th key={g} scope="col" className="pb-1 text-center font-mono text-[9px] font-normal text-washi-mo/70">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((period) => (
              <tr key={period}>
                <th scope="row" className="pr-1.5 text-right font-mono text-[9px] font-normal text-washi-mo/70">
                  {period}
                </th>
                {GROUPS.map((group) => {
                  if (group === 3 && (period === 6 || period === 7)) {
                    return (
                      <td key={group} className="p-0">
                        <span className="flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-[7px] border border-dashed border-washi/20 text-[9px] text-washi-mo">
                          {period === 6 ? "57–71" : "89–103"}
                        </span>
                      </td>
                    );
                  }
                  return renderElementCell(group, byCoordinate.get(`${period}-${group}`));
                })}
              </tr>
            ))}
            <tr aria-hidden="true">
              <td colSpan={19} className="h-2 p-0" />
            </tr>
            {([
              { period: 8, range: "57–71", name: "Họ Lantan" },
              { period: 9, range: "89–103", name: "Họ Actini" },
            ] as const).map((row) => (
              <tr key={row.period}>
                <th scope="row" className="pr-1.5 text-right font-mono text-[9px] font-normal text-washi-mo/70">
                  <span className="sr-only">{row.name}, </span>
                  {row.range}
                </th>
                {GROUPS.map((group) => renderElementCell(group, byCoordinate.get(`${row.period}-${group}`)))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <h2 className="sr-only">Chú giải màu khối nguyên tố</h2>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {(Object.keys(BLOCK_COLORS) as ElementBlock[]).map((k) => (
          <span key={k} className="flex items-center gap-2 text-xs text-washi-mo">
            <i className="h-3 w-3 rounded-[3px]" style={{ background: BLOCK_COLORS[k] }} />
            {BLOCK_LABELS[k]}
          </span>
        ))}
        <span className="flex items-start gap-2 text-xs text-washi-mo/80">
          <Info size={14} className="mt-0.5 shrink-0 text-kin" />
          Số liệu từng ô (khối lượng, nhiệt độ chuyển pha, độ âm điện…) đồng bộ từ PubChem PUG-REST, cache có kiểm soát.
          Dấu <span className="text-kin">*</span> bên số hiệu nguyên tử: trạng thái vật chất PubChem đánh dấu “dự đoán”, chưa đo trực tiếp.
        </span>
      </div>
    </div>
  );
}
