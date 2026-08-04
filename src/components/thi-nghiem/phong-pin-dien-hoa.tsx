"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import type { NguyenTo } from "@/lib/pubchem";
import { layDienCucChuan } from "@/lib/hoa-hoc/the-dien-cuc-chuan";
import { tinhDienHoa } from "@/lib/hoa-hoc/nernst";

const SO_HIEU_HYDRO = 1;

function ThanhTruotNongDo({
  nhan,
  giaTri,
  khiSua,
  khoa,
}: {
  nhan: string;
  giaTri: number;
  khiSua: (v: number) => void;
  khoa?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-sm text-washi-mo">
          {nhan} <span className="font-mono text-[10px] text-washi-mo/60">(mol/L)</span>
        </p>
        <span className="font-mono text-sm font-semibold tabular-nums text-shu-sang">
          {khoa ? "cố định" : giaTri.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={0.01}
        max={5}
        step={0.01}
        value={khoa ? 1 : giaTri}
        disabled={khoa}
        onChange={(e) => khiSua(Number(e.target.value))}
        className="w-full cursor-ew-resize disabled:opacity-30"
        aria-label={nhan}
        aria-valuetext={khoa ? "Điện cực chuẩn, cố định" : `${giaTri.toFixed(2)} mol trên lít`}
      />
      {khoa && (
        <p className="mt-1.5 text-[10px] text-kin">
          Điện cực hydro chuẩn (SHE) — quy ước cố định 0V, mô phỏng này không tính áp suất khí H₂ nên nồng độ
          không áp dụng.
        </p>
      )}
    </div>
  );
}

function ChonDienCuc({
  nhan,
  cacNguyenTo,
  soDaChon,
  khiChon,
}: {
  nhan: string;
  cacNguyenTo: NguyenTo[];
  soDaChon: number | null;
  khiChon: (so: number) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-washi-mo">{nhan}</p>
      <div className="relative">
        <select
          value={soDaChon ?? ""}
          onChange={(e) => khiChon(Number(e.target.value))}
          className="w-full appearance-none rounded-xl border border-washi/15 bg-sumi-nhat px-4 py-3 text-sm outline-none transition-colors focus:border-shu-sang"
          aria-label={nhan}
        >
          <option value="" disabled className="bg-sumi-nhat">
            — chọn điện cực —
          </option>
          {cacNguyenTo.map((n) => (
            <option key={n.so} value={n.so} className="bg-sumi-nhat">
              {n.so}. {n.tenVi} ({n.kyHieu})
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-washi-mo" />
      </div>
    </div>
  );
}

export default function PhongPinDienHoa() {
  const [nguyenTo, setNguyenTo] = useState<NguyenTo[] | null>(null);

  useEffect(() => {
    let huy = false;
    fetch("/api/danh-sach-nguyen-to")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NguyenTo[] | null) => {
        if (!huy && d) setNguyenTo(d);
      })
      .catch(() => {
        /* Danh sách nguyên tố chỉ để hiện tên/ký hiệu trong bộ chọn — không có cũng không sao */
      });
    return () => {
      huy = true;
    };
  }, []);

  const coDienCucChuan = useMemo(
    () => (nguyenTo ?? []).filter((n) => layDienCucChuan(n.so) !== null),
    [nguyenTo],
  );
  const bangTen = useMemo(() => new Map(coDienCucChuan.map((n) => [n.so, n])), [coDienCucChuan]);

  const [soA, setSoA] = useState<number | null>(null);
  const [soB, setSoB] = useState<number | null>(null);
  const [nongDoA, setNongDoA] = useState(1.0);
  const [nongDoB, setNongDoB] = useState(1.0);

  const trungNhau = soA != null && soB != null && soA === soB;
  const ketQua = soA != null && soB != null && !trungNhau ? tinhDienHoa(soA, soB, nongDoA, nongDoB) : null;

  const tenDienCuc = (so: number | null) => (so != null ? bangTen.get(so) : undefined);
  const anode = tenDienCuc(ketQua?.soAnode ?? null);
  const cathode = tenDienCuc(ketQua?.soCathode ?? null);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
      <div className="the-khac rounded-3xl p-5 sm:p-7">
        <p className="chi-muc mb-4 text-shu-sang">Chọn hai điện cực</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChonDienCuc nhan="Điện cực A" cacNguyenTo={coDienCucChuan} soDaChon={soA} khiChon={setSoA} />
          <ChonDienCuc nhan="Điện cực B" cacNguyenTo={coDienCucChuan} soDaChon={soB} khiChon={setSoB} />
        </div>

        <div className="mt-6 space-y-5">
          <ThanhTruotNongDo
            nhan={`Nồng độ ion${tenDienCuc(soA) ? ` (${tenDienCuc(soA)!.kyHieu})` : " (A)"}`}
            giaTri={nongDoA}
            khiSua={setNongDoA}
            khoa={soA === SO_HIEU_HYDRO}
          />
          <ThanhTruotNongDo
            nhan={`Nồng độ ion${tenDienCuc(soB) ? ` (${tenDienCuc(soB)!.kyHieu})` : " (B)"}`}
            giaTri={nongDoB}
            khiSua={setNongDoB}
            khoa={soB === SO_HIEU_HYDRO}
          />
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-washi-mo/80">
          Thế điện cực chuẩn (E°) đã ghim từ CRC Handbook of Chemistry and Physics / Electrochemical Series —
          xem src/lib/hoa-hoc/the-dien-cuc-chuan.ts. Anode/cathode được xác định theo E° chuẩn, không phải
          người dùng tự chọn.
        </p>
      </div>

      <div className="the-khac relative flex flex-col justify-center rounded-3xl p-6 sm:p-8">
        <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">電池 — pin điện hóa</p>

        {(soA == null || soB == null) && (
          <div className="text-center text-washi-mo">
            <Zap size={36} className="mx-auto mb-3 text-washi/20" />
            <p className="text-sm">Chọn hai điện cực để tạo thành một pin Galvanic.</p>
          </div>
        )}

        {trungNhau && (
          <div role="alert" className="rounded-2xl border border-shu-sang/40 bg-shu/10 p-5 text-center">
            <p className="font-semibold text-shu-sang">Không phải một pin thật</p>
            <p className="mt-2 text-sm text-washi-mo">Cần hai điện cực khác nhau.</p>
          </div>
        )}

        {ketQua && anode && cathode && (
          <div className="text-center">
            <p className="font-mono text-5xl font-bold tabular-nums text-kin">
              {ketQua.eCell >= 0 ? "+" : ""}
              {ketQua.eCell.toFixed(3)} V
            </p>
            <p className="mt-2 text-sm text-washi-mo">
              Anode (oxi hóa): <strong className="text-washi">{anode.tenVi} ({anode.kyHieu})</strong> → Cathode
              (khử): <strong className="text-washi">{cathode.tenVi} ({cathode.kyHieu})</strong>
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-washi-mo/70">
              e⁻ chảy: {anode.kyHieu} → {cathode.kyHieu} (qua mạch ngoài)
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-washi-mo">
              <span className="rounded-full border border-washi/12 px-3 py-1.5">E°_cell = {ketQua.eoCell.toFixed(4)} V</span>
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                ΔG° = {ketQua.deltaG0 > 0 ? "+" : ""}
                {ketQua.deltaG0.toFixed(2)} kJ/mol
              </span>
            </div>

            <p className="mt-5 font-mono text-[11px] text-washi-mo/80">
              {ketQua.tuXayRa
                ? "Tự xảy ra theo chiều đã sắp: E_cell > 0 ở nồng độ này."
                : "Không tự xảy ra theo chiều đã sắp ở nồng độ này (E_cell ≤ 0)."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
