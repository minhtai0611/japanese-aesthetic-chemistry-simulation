"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Info } from "lucide-react";
import type { NguyenTo } from "@/lib/pubchem";
import { MAU_KHOI, NHAN_KHOI, type KhoiKinh } from "@/lib/nguyen-to";

const CAC_KHOI: (KhoiKinh | "tat")[] = ["tat", "s", "p", "d", "f"];
const CAC_TRANG_THAI = [
  { khoa: "tat", nhan: "Tất cả" },
  { khoa: "ran", nhan: "Rắn" },
  { khoa: "long", nhan: "Lỏng" },
  { khoa: "khi", nhan: "Khí" },
  { khoa: "chua-xac-dinh", nhan: "Siêu tổng hợp" },
] as const;

function chuanHoa(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export default function BangTuanHoanTuongTac({ nguyenTo }: { nguyenTo: NguyenTo[] }) {
  const [tu, setTu] = useState("");
  const [khoi, setKhoi] = useState<KhoiKinh | "tat">("tat");
  const [trangThai, setTrangThai] = useState<string>("tat");

  const daLoc = useMemo(() => {
    const t = chuanHoa(tu.trim());
    return new Set(
      nguyenTo
        .filter((n) => {
          if (khoi !== "tat" && n.khoi !== khoi) return false;
          if (trangThai !== "tat" && n.trangThai !== (trangThai as NguyenTo["trangThai"])) return false;
          if (!t) return true;
          return (
            chuanHoa(n.tenVi).includes(t) ||
            chuanHoa(n.tenEn).includes(t) ||
            chuanHoa(n.kyHieu).includes(t) ||
            String(n.so) === t
          );
        })
        .map((n) => n.so),
    );
  }, [nguyenTo, tu, khoi, trangThai]);

  const dongMo = tu.trim() !== "" || khoi !== "tat" || trangThai !== "tat";

  const theoOToa = useMemo(() => {
    const m = new Map<string, NguyenTo>();
    for (const n of nguyenTo) m.set(`${n.chuKiHienThi}-${n.nhom}`, n);
    return m;
  }, [nguyenTo]);

  const CAC_NHOM = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 1), []);

  const oNguyenTo = (nhom: number, n: NguyenTo | undefined) => {
    if (!n) return <td key={nhom} />;
    const hien = !dongMo || daLoc.has(n.so);
    return (
      <td key={nhom} className="p-0">
        <motion.div
          layout={false}
          animate={{ opacity: hien ? 1 : 0.12, scale: hien ? 1 : 0.86 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href={`/nguyen-to/${n.kyHieu.toLowerCase()}`}
            title={`${n.tenVi} (${n.kyHieu}) — Z = ${n.so}${n.trangThaiCertainty === "du-doan" ? " — trạng thái dự đoán, chưa đo trực tiếp" : ""}`}
            className="group relative block aspect-square min-h-11 min-w-11 overflow-hidden rounded-[7px] border px-1.5 pt-1 transition-transform duration-300 hover:z-10 hover:scale-[1.25] hover:shadow-[0_8px_30px_rgba(0,0,0,0.55)]"
            style={{
              borderColor: `${MAU_KHOI[n.khoi]}66`,
              background: `linear-gradient(155deg, ${MAU_KHOI[n.khoi]}2e, #12100c 70%)`,
            }}
          >
            <span className="block text-[9px] leading-none text-washi-mo/80 tabular-nums">
              {n.so}
              {n.trangThaiCertainty === "du-doan" && (
                <span className="text-kin" aria-hidden>
                  {" "}*
                </span>
              )}
            </span>
            <span
              className="mt-0.5 block font-display text-[15px] font-bold leading-none sm:text-base"
              style={{ color: MAU_KHOI[n.khoi] }}
            >
              {n.kyHieu}
            </span>
            <span className="mt-1 block truncate text-[8.5px] leading-tight text-washi-mo">
              {n.tenVi}
            </span>
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
              style={{ background: MAU_KHOI[n.khoi] }}
            />
          </Link>
        </motion.div>
      </td>
    );
  };

  return (
    <div>
      <h2 className="sr-only">Bảng tuần hoàn tương tác</h2>
      {/* Công cụ lọc */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="the-khac flex max-w-md flex-1 items-center gap-3 rounded-2xl px-4 py-3">
          <Search size={18} className="shrink-0 text-shu-sang" />
          <input
            value={tu}
            onChange={(e) => setTu(e.target.value)}
            placeholder="Tìm theo tên, ký hiệu, số hiệu… (vd: vàng, O2, 79)"
            className="w-full bg-transparent text-sm text-washi outline-none placeholder:text-washi-mo/60"
            aria-label="Tìm kiếm nguyên tố"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CAC_KHOI.map((k) => (
            <button
              key={k}
              onClick={() => setKhoi(k)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                khoi === k
                  ? "border-transparent text-sumi"
                  : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
              }`}
              style={khoi === k ? { background: k === "tat" ? "#f2ead9" : MAU_KHOI[k], color: "#0b0a08" } : {}}
            >
              {k === "tat" ? "Tất cả" : NHAN_KHOI[k]}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-washi/15 sm:block" />
          {CAC_TRANG_THAI.map((tt) => (
            <button
              key={tt.khoa}
              onClick={() => setTrangThai(tt.khoa)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                trangThai === tt.khoa
                  ? "border-transparent bg-kin text-sumi"
                  : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
              }`}
            >
              {tt.nhan}
            </button>
          ))}
        </div>
      </div>

      {/* Lưới bảng */}
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
              {CAC_NHOM.map((g) => (
                <th key={g} scope="col" className="pb-1 text-center font-mono text-[9px] font-normal text-washi-mo/70">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((chuKi) => (
              <tr key={chuKi}>
                <th scope="row" className="pr-1.5 text-right font-mono text-[9px] font-normal text-washi-mo/70">
                  {chuKi}
                </th>
                {CAC_NHOM.map((nhom) => {
                  if (nhom === 3 && (chuKi === 6 || chuKi === 7)) {
                    return (
                      <td key={nhom} className="p-0">
                        <span className="flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-[7px] border border-dashed border-washi/20 text-[9px] text-washi-mo">
                          {chuKi === 6 ? "57–71" : "89–103"}
                        </span>
                      </td>
                    );
                  }
                  return oNguyenTo(nhom, theoOToa.get(`${chuKi}-${nhom}`));
                })}
              </tr>
            ))}
            <tr aria-hidden="true">
              <td colSpan={19} className="h-2 p-0" />
            </tr>
            {([
              { chuKi: 8, khoang: "57–71", ten: "Họ Lantan" },
              { chuKi: 9, khoang: "89–103", ten: "Họ Actini" },
            ] as const).map((hang) => (
              <tr key={hang.chuKi}>
                <th scope="row" className="pr-1.5 text-right font-mono text-[9px] font-normal text-washi-mo/70">
                  <span className="sr-only">{hang.ten}, </span>
                  {hang.khoang}
                </th>
                {CAC_NHOM.map((nhom) => oNguyenTo(nhom, theoOToa.get(`${hang.chuKi}-${nhom}`)))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chú giải */}
      <h2 className="sr-only">Chú giải màu khối nguyên tố</h2>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {(Object.keys(MAU_KHOI) as KhoiKinh[]).map((k) => (
          <span key={k} className="flex items-center gap-2 text-xs text-washi-mo">
            <i className="h-3 w-3 rounded-[3px]" style={{ background: MAU_KHOI[k] }} />
            {NHAN_KHOI[k]}
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
