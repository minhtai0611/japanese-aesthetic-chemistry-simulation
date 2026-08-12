"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import type { ElementInfo } from "@/lib/pubchem";
import { getStandardElectrodePotential } from "@/lib/chemistry/standard-electrode-potential";
import { calculateElectrochemistry } from "@/lib/chemistry/nernst";

const HYDROGEN_ATOMIC_NUMBER = 1;

function ConcentrationSlider({
  label,
  value,
  onChange,
  locked,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  locked?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-sm text-washi-mo">
          {label} <span className="font-mono text-[10px] text-washi-mo/60">(mol/L)</span>
        </p>
        <span className="font-mono text-sm font-semibold tabular-nums text-shu-sang">
          {locked ? "cố định" : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={0.01}
        max={5}
        step={0.01}
        value={locked ? 1 : value}
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-ew-resize disabled:opacity-30"
        aria-label={label}
        aria-valuetext={locked ? "Điện cực chuẩn, cố định" : `${value.toFixed(2)} mol trên lít`}
      />
      {locked && (
        <p className="mt-1.5 text-[10px] text-kin">
          Điện cực hydro chuẩn (SHE) — quy ước cố định 0V, mô phỏng này không tính áp suất khí H₂ nên nồng độ
          không áp dụng.
        </p>
      )}
    </div>
  );
}

function ElectrodeSelect({
  label,
  elements,
  selectedNumber,
  onSelect,
}: {
  label: string;
  elements: ElementInfo[];
  selectedNumber: number | null;
  onSelect: (so: number) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-washi-mo">{label}</p>
      <div className="relative">
        <select
          value={selectedNumber ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full appearance-none rounded-xl border border-washi/15 bg-sumi-nhat px-4 py-3 text-sm outline-none transition-colors focus:border-shu-sang"
          aria-label={label}
        >
          <option value="" disabled className="bg-sumi-nhat">
            — chọn điện cực —
          </option>
          {elements.map((n) => (
            <option key={n.atomicNumber} value={n.atomicNumber} className="bg-sumi-nhat">
              {n.atomicNumber}. {n.vietnameseName} ({n.symbol})
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-washi-mo" />
      </div>
    </div>
  );
}

export default function ElectrochemicalCellLab() {
  const [elements, setElements] = useState<ElementInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/elements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ElementInfo[] | null) => {
        if (!cancelled && d) setElements(d);
      })
      .catch(() => {
        /* Element list is only used to show the name/symbol in the picker — fine if unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const electrodesWithStandardPotential = useMemo(
    () => (elements ?? []).filter((n) => getStandardElectrodePotential(n.atomicNumber) !== null),
    [elements],
  );
  const elementsByNumber = useMemo(
    () => new Map(electrodesWithStandardPotential.map((n) => [n.atomicNumber, n])),
    [electrodesWithStandardPotential],
  );

  const [numberA, setNumberA] = useState<number | null>(null);
  const [numberB, setNumberB] = useState<number | null>(null);
  const [concentrationA, setConcentrationA] = useState(1.0);
  const [concentrationB, setConcentrationB] = useState(1.0);

  const sameElement = numberA != null && numberB != null && numberA === numberB;
  const result = numberA != null && numberB != null && !sameElement ? calculateElectrochemistry(numberA, numberB, concentrationA, concentrationB) : null;

  const electrodeFor = (so: number | null) => (so != null ? elementsByNumber.get(so) : undefined);
  const anode = electrodeFor(result?.anodeAtomicNumber ?? null);
  const cathode = electrodeFor(result?.cathodeAtomicNumber ?? null);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
      <div className="the-khac rounded-3xl p-5 sm:p-7">
        <p className="chi-muc mb-4 text-shu-sang">Chọn hai điện cực</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <ElectrodeSelect label="Điện cực A" elements={electrodesWithStandardPotential} selectedNumber={numberA} onSelect={setNumberA} />
          <ElectrodeSelect label="Điện cực B" elements={electrodesWithStandardPotential} selectedNumber={numberB} onSelect={setNumberB} />
        </div>

        <div className="mt-6 space-y-5">
          <ConcentrationSlider
            label={`Nồng độ ion${electrodeFor(numberA) ? ` (${electrodeFor(numberA)!.symbol})` : " (A)"}`}
            value={concentrationA}
            onChange={setConcentrationA}
            locked={numberA === HYDROGEN_ATOMIC_NUMBER}
          />
          <ConcentrationSlider
            label={`Nồng độ ion${electrodeFor(numberB) ? ` (${electrodeFor(numberB)!.symbol})` : " (B)"}`}
            value={concentrationB}
            onChange={setConcentrationB}
            locked={numberB === HYDROGEN_ATOMIC_NUMBER}
          />
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-washi-mo/80">
          Thế điện cực chuẩn (E°) đã ghim từ CRC Handbook of Chemistry and Physics / Electrochemical Series —
          xem src/lib/chemistry/standard-electrode-potential.ts. Anode/cathode được xác định theo E° chuẩn, không phải
          người dùng tự chọn.
        </p>
      </div>

      <div className="the-khac relative flex flex-col justify-center rounded-3xl p-6 sm:p-8">
        <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">電池 — pin điện hóa</p>

        {(numberA == null || numberB == null) && (
          <div className="text-center text-washi-mo">
            <Zap size={36} className="mx-auto mb-3 text-washi/20" />
            <p className="text-sm">Chọn hai điện cực để tạo thành một pin Galvanic.</p>
          </div>
        )}

        {sameElement && (
          <div role="alert" className="rounded-2xl border border-shu-sang/40 bg-shu/10 p-5 text-center">
            <p className="font-semibold text-shu-sang">Không phải một pin thật</p>
            <p className="mt-2 text-sm text-washi-mo">Cần hai điện cực khác nhau.</p>
          </div>
        )}

        {result && anode && cathode && (
          <div className="text-center">
            <p className="font-mono text-5xl font-bold tabular-nums text-kin">
              {result.eCell >= 0 ? "+" : ""}
              {result.eCell.toFixed(3)} V
            </p>
            <p className="mt-2 text-sm text-washi-mo">
              Anode (oxi hóa): <strong className="text-washi">{anode.vietnameseName} ({anode.symbol})</strong> → Cathode
              (khử): <strong className="text-washi">{cathode.vietnameseName} ({cathode.symbol})</strong>
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-washi-mo/70">
              e⁻ chảy: {anode.symbol} → {cathode.symbol} (qua mạch ngoài)
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-washi-mo">
              <span className="rounded-full border border-washi/12 px-3 py-1.5">E°_cell = {result.eoCell.toFixed(4)} V</span>
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                ΔG° = {result.deltaG0 > 0 ? "+" : ""}
                {result.deltaG0.toFixed(2)} kJ/mol
              </span>
            </div>

            <p className="mt-5 font-mono text-[11px] text-washi-mo/80">
              {result.isSpontaneous
                ? "Tự xảy ra theo chiều đã sắp: E_cell > 0 ở nồng độ này."
                : "Không tự xảy ra theo chiều đã sắp ở nồng độ này (E_cell ≤ 0)."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
