"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, Sigma } from "lucide-react";
import { balanceEquation, type BalanceResult } from "@/lib/chemistry/equilibrium";
import type { ThermodynamicsResult } from "@/lib/chemistry/thermodynamics";
import { parseFormula } from "@/lib/chemistry/formula-parser";
import { calculateMolarMass, molarMassBySymbolTable } from "@/lib/chemistry/molar-mass";
import type { ElementInfo } from "@/lib/pubchem";

const EXAMPLES = [
  { left: "H2 + O2", right: "H2O" },
  { left: "Fe + O2", right: "Fe2O3" },
  { left: "C3H8 + O2", right: "CO2 + H2O" },
  { left: "KMnO4 + HCl", right: "KCl + MnCl2 + Cl2 + H2O" },
  { left: "Ca(OH)2 + H3PO4", right: "Ca3(PO4)2 + H2O" },
];

function splitSpecies(input: string): string[] {
  return input
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function withSubscripts(ct: string) {
  return ct.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>));
}

export default function EquilibriumLab() {
  const [leftInput, setLeftInput] = useState(EXAMPLES[0].left);
  const [rightInput, setRightInput] = useState(EXAMPLES[0].right);
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [elements, setElements] = useState<ElementInfo[] | null>(null);
  const [thermodynamics, setThermodynamics] = useState<ThermodynamicsResult | null>(null);
  const [loadingThermodynamics, setLoadingThermodynamics] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/elements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ElementInfo[] | null) => {
        if (!cancelled && d) setElements(d);
      })
      .catch(() => {
        /* Atomic mass table is only used to additionally show mass conservation — fine if unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const molarMassTable = useMemo(() => (elements ? molarMassBySymbolTable(elements) : null), [elements]);

  const balance = () => {
    const left = splitSpecies(leftInput);
    const right = splitSpecies(rightInput);
    const balanced = balanceEquation(left, right);
    setResult(balanced);
    setThermodynamics(null);
    // Thermodynamics lookup (PubChem + Materials Project, see thermodynamics.ts) is kept
    // separate from balanceEquation() — balanceEquation() must stay pure and synchronous.
    // Called via the API route (/api/thermodynamics), NOT importing thermodynamics.ts
    // directly here: it touches pubchem.ts → pg (Node-only) and MATERIALS_PROJECT_API_KEY
    // must not leak into the "use client" bundle.
    if (balanced.ok) {
      setLoadingThermodynamics(true);
      fetch("/api/thermodynamics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftNames: left, leftCoefficients: balanced.leftCoefficients, rightNames: right, rightCoefficients: balanced.rightCoefficients }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(setThermodynamics)
        .catch(() => setThermodynamics(null))
        .finally(() => setLoadingThermodynamics(false));
    }
  };

  const leftSpecies = splitSpecies(leftInput);
  const rightSpecies = splitSpecies(rightInput);

  const totalMassOf = (species: string[], coefficients?: number[]) => {
    if (!molarMassTable || !coefficients) return null;
    try {
      return species.reduce((sum, ct, i) => sum + calculateMolarMass(parseFormula(ct), molarMassTable) * coefficients[i], 0);
    } catch {
      return null;
    }
  };

  const massLeft = result?.ok ? totalMassOf(leftSpecies, result.leftCoefficients) : null;
  const massRight = result?.ok ? totalMassOf(rightSpecies, result.rightCoefficients) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
      <div className="the-khac rounded-3xl p-5 sm:p-7">
        <p className="chi-muc mb-4 text-shu-sang">Nhập phương trình chưa cân bằng</p>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-washi-mo" htmlFor="side-left">
              Vế trái (chất phản ứng, ngăn cách bằng dấu +)
            </label>
            <div className="the-khac rounded-2xl px-5 py-3.5">
              <input
                id="side-left"
                value={leftInput}
                onChange={(e) => {
                  setLeftInput(e.target.value);
                  setResult(null);
                  setThermodynamics(null);
                }}
                placeholder="Fe + O2"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-washi-mo/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-washi-mo" htmlFor="side-right">
              Vế phải (sản phẩm)
            </label>
            <div className="the-khac rounded-2xl px-5 py-3.5">
              <input
                id="side-right"
                value={rightInput}
                onChange={(e) => {
                  setRightInput(e.target.value);
                  setResult(null);
                  setThermodynamics(null);
                }}
                placeholder="Fe2O3"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-washi-mo/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={balance}
          className="nut-chu mt-5 flex items-center gap-2 rounded-full bg-shu px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Scale size={16} />
          Cân bằng phương trình
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.left}
              onClick={() => {
                setLeftInput(example.left);
                setRightInput(example.right);
                setResult(null);
                setThermodynamics(null);
              }}
              className="rounded-full border border-washi/12 px-3.5 py-1.5 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
            >
              {example.left} → {example.right}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-washi-mo/80">
          Cân bằng bằng khử Gauss-Jordan trên số hữu tỉ (bigint), không dùng AI, không đoán —
          xem src/lib/chemistry/equilibrium.ts.
        </p>
      </div>

      <div className="the-khac relative flex flex-col justify-center rounded-3xl p-6 sm:p-8">
        <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">均衡 — cân bằng</p>

        {!result && (
          <div className="text-center text-washi-mo">
            <Sigma size={36} className="mx-auto mb-3 text-washi/20" />
            <p className="text-sm">Nhập phương trình rồi bấm &ldquo;Cân bằng phương trình&rdquo;.</p>
          </div>
        )}

        {result && !result.ok && (
          <div role="alert" className="rounded-2xl border border-shu-sang/40 bg-shu/10 p-5 text-center">
            <p className="font-semibold text-shu-sang">Không cân bằng được</p>
            <p className="mt-2 text-sm text-washi-mo">{result.reason}</p>
          </div>
        )}

        {result?.ok && (
          <div className="text-center">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 font-display text-2xl font-bold sm:text-3xl">
              {leftSpecies.map((ct, i) => (
                <span key={`t${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-washi-mo">+</span>}
                  <span className="text-kin">{result.leftCoefficients[i] > 1 ? result.leftCoefficients[i] : ""}</span>
                  <span>{withSubscripts(ct)}</span>
                </span>
              ))}
              <span className="mx-1 text-shu-sang">→</span>
              {rightSpecies.map((ct, i) => (
                <span key={`p${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-washi-mo">+</span>}
                  <span className="text-kin">{result.rightCoefficients[i] > 1 ? result.rightCoefficients[i] : ""}</span>
                  <span>{withSubscripts(ct)}</span>
                </span>
              ))}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-washi-mo">
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                Hệ số trái: {result.leftCoefficients.join(", ")}
              </span>
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                Hệ số phải: {result.rightCoefficients.join(", ")}
              </span>
            </div>

            {massLeft != null && massRight != null && (
              <p className="mt-5 font-mono text-[11px] text-washi-mo/80">
                Bảo toàn khối lượng (khối lượng nguyên tử thật từ PubChem):{" "}
                <strong className="text-washi">{massLeft.toFixed(2)} g</strong> ={" "}
                <strong className="text-washi">{massRight.toFixed(2)} g</strong>
              </p>
            )}

            {loadingThermodynamics && (
              <p className="mt-3 font-mono text-[11px] text-washi-mo/60">
                Đang tra nhiệt động lực học (PubChem + Materials Project)…
              </p>
            )}

            {!loadingThermodynamics && thermodynamics && (
              thermodynamics.hasData ? (
                <div className="mt-3 space-y-1.5 font-mono text-[11px] text-washi-mo/80">
                  <p>
                    {thermodynamics.deltaH < 0
                      ? "Phản ứng tỏa nhiệt (Exothermic): "
                      : thermodynamics.deltaH > 0
                        ? "Phản ứng thu nhiệt (Endothermic): "
                        : ""}
                    ΔH° ={" "}
                    <strong className="text-washi">
                      {thermodynamics.deltaH > 0 ? "+" : ""}
                      {thermodynamics.deltaH.toFixed(1)} kJ/mol
                    </strong>
                    {thermodynamics.hasDftSource &&
                      " (một phần từ Materials Project, DFT ~0K — không hoàn toàn tương đương ΔH°f thực nghiệm)"}
                  </p>
                  {thermodynamics.deltaG != null ? (
                    <p>
                      {thermodynamics.deltaG < 0
                        ? "Phản ứng tự xảy ra theo nhiệt động lực học ở 298 K: "
                        : "Không tự xảy ra ở 298 K theo nhiệt động lực học: "}
                      ΔG° ={" "}
                      <strong className="text-washi">
                        {thermodynamics.deltaG > 0 ? "+" : ""}
                        {thermodynamics.deltaG.toFixed(1)} kJ/mol
                      </strong>
                    </p>
                  ) : (
                    <p className="text-washi-mo/60">
                      Không đủ dữ liệu đã xác minh để tính ΔG° (tính tự phát) cho phản ứng này.
                    </p>
                  )}
                  <p className="text-washi-mo/50">
                    Nguồn:{" "}
                    {thermodynamics.sourceDetails.map((c, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {c.name} ({c.source === "ghim" ? "NIST/CODATA, đã xác minh" : "Materials Project, DFT"}
                        {c.cid != null && (
                          <>
                            {" · "}
                            <a
                              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${c.cid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              CID {c.cid}
                            </a>
                          </>
                        )}
                        )
                      </span>
                    ))}
                  </p>
                </div>
              ) : (
                <p className="mt-3 font-mono text-[11px] text-washi-mo/60">
                  Không có dữ liệu nhiệt động (NIST/CODATA hoặc Materials Project) cho: {thermodynamics.missingSubstances.join(", ")}.
                </p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
