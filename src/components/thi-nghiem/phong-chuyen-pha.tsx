"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Snowflake, Waves, Wind } from "lucide-react";
import type { NguyenTo } from "@/lib/pubchem";
import { useGiamChuyenDong } from "@/lib/dung-chuyen-dong";
import { useCheDoTietKiem } from "@/components/che-do-tiet-kiem";
import { deltaHVapKJMol, duongRanhGioiLongKhi, nhietDoSoiTheoApSuat } from "@/lib/hoa-hoc/gian-do-pha";

interface Hat {
  x: number; y: number; vx: number; vy: number; gx: number; gy: number;
}

/** Hệ hạt: rắn dao động quanh mạng tinh thể, lỏng trôi Brown, khí bay tự do */
function useDongCoHat(soHat: number, trangThai: "ran" | "long" | "khi", rung: number) {
  const thamChieuCanvas = useRef<HTMLCanvasElement | null>(null);
  const cacHat = useRef<Hat[]>([]);
  const cauHinh = useRef({ trangThai: "ran" as "ran" | "long" | "khi", rung: 0.4 });
  const giam = useGiamChuyenDong();

  // Cập nhật cấu hình động cơ hạt ngay trong hook sở hữu ref này — tránh mutate
  // một giá trị được trả ra ngoài cho component gọi (react-hooks/immutability).
  useEffect(() => {
    cauHinh.current.trangThai = trangThai;
    cauHinh.current.rung = rung;
  }, [trangThai, rung]);

  useEffect(() => {
    const canvas = thamChieuCanvas.current;
    if (!canvas) return;
    const boiCanh = canvas.getContext("2d");
    if (!boiCanh) return;

    let raf = 0;
    let chay = true;
    const khung = { w: 0, h: 0 };

    const dungHat = () => {
      const cot = Math.ceil(Math.sqrt(soHat * (khung.w / Math.max(khung.h, 1))));
      const hang = Math.ceil(soHat / cot);
      const bx = khung.w / (cot + 1);
      const by = (khung.h * 0.72) / (hang + 1);
      cacHat.current = Array.from({ length: soHat }, (_, i) => {
        const c = i % cot;
        const r = Math.floor(i / cot);
        const gx = bx * (c + 1);
        const gy = khung.h * 0.24 + by * (r + 1);
        return { x: gx, y: gy, gx, gy, vx: 0, vy: 0 };
      });
    };

    // Vẽ một khung tĩnh tại vị trí lưới gốc (gx, gy) — dùng khi
    // prefers-reduced-motion để tránh dao động sin/cos liên tục.
    const veTinh = () => {
      boiCanh.clearRect(0, 0, khung.w, khung.h);
      for (const h of cacHat.current) {
        boiCanh.beginPath();
        boiCanh.arc(h.gx, h.gy, 4.4, 0, Math.PI * 2);
        boiCanh.fillStyle = "rgba(242,234,217,0.92)";
        boiCanh.fill();
        boiCanh.lineWidth = 1.6;
        boiCanh.strokeStyle = "rgba(214,59,31,0.55)";
        boiCanh.stroke();
      }
    };

    const doiKichThuoc = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hop = canvas.getBoundingClientRect();
      khung.w = hop.width;
      khung.h = hop.height;
      canvas.width = hop.width * dpr;
      canvas.height = hop.height * dpr;
      boiCanh.setTransform(dpr, 0, 0, dpr, 0, 0);
      dungHat();
      if (giam) veTinh();
    };
    doiKichThuoc();
    const quanSat = new ResizeObserver(doiKichThuoc);
    quanSat.observe(canvas);

    if (giam) {
      // Không có nhu cầu quan sát hiển thị/chạy vòng lặp — chỉ một khung tĩnh.
      return () => {
        quanSat.disconnect();
      };
    }

    const quanSatAn = new IntersectionObserver(([e]) => (chay = e.isIntersecting));
    quanSatAn.observe(canvas);

    let t = 0;
    const ve = () => {
      t += 1;
      if (chay) {
        boiCanh.clearRect(0, 0, khung.w, khung.h);
        const { trangThai, rung } = cauHinh.current;
        for (let i = 0; i < cacHat.current.length; i++) {
          const h = cacHat.current[i];
          if (trangThai === "ran") {
            h.x = h.gx + Math.sin(t * 0.09 * (1 + rung * 3) + i * 1.7) * (0.7 + rung * 2.4);
            h.y = h.gy + Math.cos(t * 0.11 * (1 + rung * 3) + i * 2.3) * (0.7 + rung * 2.4);
          } else if (trangThai === "long") {
            h.vx += (Math.sin(t * 0.02 + i * 12.9898) * 43758.5453 % 1) * 0.06;
            h.vy += (Math.cos(t * 0.017 + i * 7.233) * 24634.6345 % 1) * 0.06 + 0.012;
            h.vx *= 0.95; h.vy *= 0.95;
            h.x += h.vx; h.y += h.vy;
            if (h.y > khung.h - 8) { h.y = khung.h - 8; h.vy *= -0.4; }
            if (h.y < khung.h * 0.55) { h.y = khung.h * 0.55; h.vy *= -0.4; }
            if (h.x < 6 || h.x > khung.w - 6) h.vx *= -1;
            h.x = Math.min(Math.max(h.x, 6), khung.w - 6);
          } else {
            if (h.vx === 0 && h.vy === 0) {
              h.vx = (Math.sin(i * 91.7) * 2.4) || 1;
              h.vy = (Math.cos(i * 47.3) * 2.4) || -1;
            }
            h.x += h.vx * 2.6; h.y += h.vy * 2.6;
            if (h.x < 5 || h.x > khung.w - 5) h.vx *= -1;
            if (h.y < 5 || h.y > khung.h - 5) h.vy *= -1;
          }
          boiCanh.beginPath();
          boiCanh.arc(h.x, h.y, 4.4, 0, Math.PI * 2);
          boiCanh.fillStyle = "rgba(242,234,217,0.92)";
          boiCanh.fill();
          boiCanh.lineWidth = 1.6;
          boiCanh.strokeStyle = "rgba(214,59,31,0.55)";
          boiCanh.stroke();
        }
      }
      raf = requestAnimationFrame(ve);
    };
    raf = requestAnimationFrame(ve);

    return () => {
      cancelAnimationFrame(raf);
      quanSat.disconnect();
      quanSatAn.disconnect();
    };
  }, [soHat, giam]);

  return { thamChieuCanvas };
}

const BIEU_TUONG = {
  ran: { Ten: "RẮN", icon: Snowflake, mau: "#9db4d8" },
  long: { Ten: "LỎNG", icon: Waves, mau: "#3d8fae" },
  khi: { Ten: "KHÍ", icon: Wind, mau: "#d63b1f" },
} as const;

export default function PhongChuyenPha({ nguyenTo }: { nguyenTo: NguyenTo[] }) {
  const coDayDu = useMemo(
    () => nguyenTo.filter((n) => n.nongChayK !== null && n.soiK !== null && n.soiK > n.nongChayK),
    [nguyenTo],
  );
  const boSoDayDu = useMemo(() => new Set(coDayDu.map((n) => n.so)), [coDayDu]);
  const [so, setSo] = useState(26); // Sắt
  const nt = coDayDu.find((n) => n.so === so) ?? coDayDu[0];

  // Áp suất: trượt trên thang log (logApSuat ∈ [-2, 2] ⇒ 0.01–100 atm), mặc định 1 atm.
  const [logApSuat, setLogApSuat] = useState(0);
  const apSuatAtm = 10 ** logApSuat;
  const deltaHVap = nt ? deltaHVapKJMol(nt.so) : null;
  const coDuLieuBayHoi = deltaHVap !== null;
  // Điểm sôi HIỆU DỤNG ở áp suất hiện tại: đúng số đo PubChem tại 1 atm; suy
  // ra bằng Clausius-Clapeyron khi đổi áp suất VÀ có ΔH_vap; nếu không có
  // ΔH_vap thì giữ nguyên mốc 1 atm và gắn cờ "chưa xác định" (không suy đoán).
  const soiKHieuDung =
    nt?.soiK == null
      ? null
      : apSuatAtm !== 1 && coDuLieuBayHoi
        ? nhietDoSoiTheoApSuat(deltaHVap!, nt.soiK, apSuatAtm)
        : nt.soiK;

  const tToiDa = Math.ceil((soiKHieuDung ?? nt?.soiK ?? 3600) * 1.1);
  const [nhietDo, setNhietDo] = useState(300);

  // Đổi nguyên tố → đặt lại nhiệt độ khởi điểm + áp suất về 1 atm. Điều chỉnh
  // state khi lựa chọn đổi, ngay trong render thay vì effect (mẫu hình chính
  // thức của React).
  const [soTruoc, setSoTruoc] = useState(nt?.so);
  if (nt && nt.so !== soTruoc) {
    setSoTruoc(nt.so);
    setNhietDo(Math.round(Math.min(300, tToiDa * 0.5)));
    setLogApSuat(0);
  }

  const trangThai: "ran" | "long" | "khi" = !nt
    ? "ran"
    : nhietDo < (nt.nongChayK ?? 0)
      ? "ran"
      : nhietDo < (soiKHieuDung ?? 0)
        ? "long"
        : "khi";
  const rung = Math.min(nhietDo / Math.max(nt?.nongChayK ?? 1, 1), 2);

  const [tietKiem] = useCheDoTietKiem();
  const soHat = tietKiem ? 24 : 96;
  const { thamChieuCanvas } = useDongCoHat(soHat, trangThai, rung);

  const BieuTuong = BIEU_TUONG[trangThai].icon;
  const denC = (k: number) => `${(k - 273.15).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} °C`;
  const denAtm = (a: number) => (a < 1 ? a.toFixed(2) : a < 10 ? a.toFixed(1) : Math.round(a).toString());

  // Giản đồ P-T: trục hoành Nhiệt độ 0–5000 K (tuyến tính), trục tung Áp
  // suất 0.01–100 atm (log). Hand-rolled SVG, cùng quy ước với đường cong
  // chuẩn độ trong phong-chuan-do.tsx (useMemo path string + viewBox).
  const PT_MIN_ATM = 0.01;
  const PT_MAX_ATM = 100;
  const PT_MAX_K = 5000;
  const giaDoPha = useMemo(() => {
    const W = 460, H = 260, PL = 46, PR = 14, PT = 14, PB = 30;
    const logMin = Math.log10(PT_MIN_ATM);
    const logMax = Math.log10(PT_MAX_ATM);
    const xCuaT = (t: number) => PL + (Math.min(Math.max(t, 0), PT_MAX_K) / PT_MAX_K) * (W - PL - PR);
    const yCuaP = (p: number) => {
      const logP = Math.log10(Math.min(Math.max(p, PT_MIN_ATM), PT_MAX_ATM));
      return PT + (1 - (logP - logMin) / (logMax - logMin)) * (H - PT - PB);
    };
    const duongSoi =
      coDuLieuBayHoi && nt?.soiK != null
        ? duongRanhGioiLongKhi(deltaHVap!, nt.soiK, PT_MIN_ATM, PT_MAX_ATM, 60)
        : [];
    const dSoi = duongSoi
      .map((d, i) => `${i === 0 ? "M" : "L"}${xCuaT(d.nhietDoK).toFixed(1)},${yCuaP(d.apSuatAtm).toFixed(1)}`)
      .join(" ");
    return { W, H, PL, PR, PT, PB, xCuaT, yCuaP, dSoi };
  }, [coDuLieuBayHoi, deltaHVap, nt]);

  const { W, H, PL, PR, PT, PB, xCuaT, yCuaP, dSoi } = giaDoPha;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Buồng quan sát */}
      <div className="the-khac relative overflow-hidden rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-0">
          <div>
            <p className="chi-muc text-shu-sang">Buồng vi hạt · 相転移</p>
            <h3 className="mt-1 font-display text-2xl font-bold">
              {nt?.tenVi} <span className="text-shu-sang">{nt?.kyHieu}</span>
            </h3>
          </div>
          <div className="text-right" aria-live="polite">
            <p className="font-mono text-4xl font-bold tabular-nums" style={{ color: BIEU_TUONG[trangThai].mau }}>
              {nhietDo.toLocaleString("vi-VN")} K
            </p>
            <p className="chi-muc flex items-center justify-end gap-1.5 text-washi-mo">
              <BieuTuong size={12} /> {BIEU_TUONG[trangThai].Ten}
            </p>
          </div>
        </div>

        <canvas ref={thamChieuCanvas} className="mt-2 h-[340px] w-full" aria-label="Mô phỏng chuyển động hạt" />

        <div className="p-6 pt-2">
          <input
            type="range" min={0} max={tToiDa} step={1} value={Math.min(nhietDo, tToiDa)}
            onChange={(e) => setNhietDo(Number(e.target.value))}
            className="w-full cursor-ew-resize" aria-label="Nhiệt độ buồng (Kelvin)"
            aria-valuetext={`${nhietDo.toLocaleString("vi-VN")} kelvin, ${denC(nhietDo)}, trạng thái ${BIEU_TUONG[trangThai].Ten.toLowerCase()}`}
          />
          {/* Thước chuyển pha */}
          <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-[#7fa0d8] via-[#c9a35a] to-[#d63b1f]">
            {nt && (
              <>
                <span
                  className="absolute -top-1 h-4 w-[3px] rounded bg-washi"
                  style={{ left: `${((nt.nongChayK ?? 0) / tToiDa) * 100}%` }}
                  title={`Nóng chảy ${nt.nongChayK} K`}
                />
                <span
                  className="absolute -top-1 h-4 w-[3px] rounded bg-shu-sang"
                  style={{ left: `${((soiKHieuDung ?? 0) / tToiDa) * 100}%` }}
                  title={`Sôi ${(soiKHieuDung ?? 0).toFixed(1)} K ở ${denAtm(apSuatAtm)} atm`}
                />
                <span
                  className="absolute -top-5 -translate-x-1/2 font-mono text-[9px] text-washi-mo"
                  style={{ left: `${((nt.nongChayK ?? 0) / tToiDa) * 100}%` }}
                >
                  nóng chảy
                </span>
                <span
                  className="absolute -top-5 -translate-x-1/2 font-mono text-[9px] text-shu-sang"
                  style={{ left: `${((soiKHieuDung ?? 0) / tToiDa) * 100}%` }}
                >
                  sôi
                </span>
              </>
            )}
          </div>

          {/* Áp suất buồng */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-washi-mo">
              <span>Áp suất buồng</span>
              <span className="font-mono font-semibold text-washi">{denAtm(apSuatAtm)} atm</span>
            </div>
            <input
              type="range" min={-2} max={2} step={0.02} value={logApSuat}
              onChange={(e) => setLogApSuat(Number(e.target.value))}
              className="w-full cursor-ew-resize" aria-label="Áp suất buồng (atm, thang log)"
              aria-valuetext={`${denAtm(apSuatAtm)} atm`}
            />
            {!coDuLieuBayHoi && apSuatAtm !== 1 && (
              <p className="mt-1.5 text-[10px] text-kin">
                Chưa xác định: {nt?.tenVi} không có ΔH hóa hơi đã ghim — điểm sôi hiển thị vẫn là số đo ở 1 atm.
              </p>
            )}
          </div>

          <p className="mt-4 text-center font-mono text-[11px] text-washi-mo">
            Trượt nhiệt độ và áp suất — điểm sôi dịch chuyển theo phương trình Clausius-Clapeyron; điểm nóng
            chảy giữ xấp xỉ không đổi (ranh giới rắn-lỏng gần như thẳng đứng trong khoảng áp suất này).
          </p>
        </div>
      </div>

      {/* Chọn nguyên tố + dữ liệu */}
      <div className="space-y-6">
        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-3 text-shu-sang">Nguyên tố trong buồng</p>
          <div className="relative">
            <select
              value={so}
              onChange={(e) => setSo(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-washi/15 bg-sumi-nhat px-4 py-3 text-sm outline-none transition-colors focus:border-shu-sang"
              aria-label="Chọn nguyên tố"
            >
              {nguyenTo.map((n) => {
                const dayDu = boSoDayDu.has(n.so);
                return (
                  <option key={n.so} value={n.so} disabled={!dayDu} className="bg-sumi-nhat">
                    {n.so}. {n.tenVi} ({n.kyHieu})
                    {!dayDu && " — PubChem chưa có điểm nóng chảy/sôi đo được"}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-washi-mo" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-washi-mo">
            {coDayDu.length}/{nguyenTo.length} nguyên tố có đủ số liệu nóng chảy &amp; sôi đo được từ PubChem, mô
            phỏng được trong buồng. {nguyenTo.length - coDayDu.length} nguyên tố còn lại (chủ yếu là siêu nặng
            tổng hợp) hiện trong danh sách nhưng bị khoá chọn — chưa từng được đo ở trạng thái khối.
          </p>
        </div>

        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-4 text-shu-sang">Giản đồ pha P-T · {nt?.tenVi}</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Giản đồ pha áp suất theo nhiệt độ">
            {[0.01, 0.1, 1, 10, 100].map((p) => (
              <g key={p}>
                <line x1={PL} x2={W - PR} y1={yCuaP(p)} y2={yCuaP(p)} stroke="rgba(242,234,217,0.07)" />
                <text x={PL - 6} y={yCuaP(p) + 3} fontSize="9" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
                  {p}
                </text>
              </g>
            ))}
            {[0, 1000, 2000, 3000, 4000, 5000].map((t) => (
              <text key={t} x={xCuaT(t)} y={H - PB + 16} fontSize="9" textAnchor="middle" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">
                {t}
              </text>
            ))}
            {nt?.nongChayK != null && (
              <line
                x1={xCuaT(nt.nongChayK)} x2={xCuaT(nt.nongChayK)} y1={PT} y2={H - PB}
                stroke="#7fa0d8" strokeDasharray="3 4" strokeOpacity={0.65}
              />
            )}
            {dSoi && <path d={dSoi} fill="none" stroke="#d63b1f" strokeWidth={2} strokeLinecap="round" />}
            <circle cx={xCuaT(nhietDo)} cy={yCuaP(apSuatAtm)} r={5} fill={BIEU_TUONG[trangThai].mau} stroke="#0b0a08" strokeWidth={2} />
            <text x={PL} y={12} fontSize="9" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">atm</text>
            <text x={W - PR} y={H - 4} fontSize="9" textAnchor="end" fill="rgba(242,234,217,0.5)" fontFamily="var(--font-mono)">K</text>
          </svg>
          <p className="mt-3 text-[11px] leading-relaxed text-washi-mo">
            {coDuLieuBayHoi
              ? "Đường đỏ: ranh giới lỏng-khí thật, tính từ ΔH hóa hơi đã ghim (CRC/Lange's) qua Clausius-Clapeyron. "
              : "Chưa có ΔH hóa hơi đã ghim cho nguyên tố này — không vẽ được đường ranh giới lỏng-khí. "}
            Đường xanh đứt: điểm nóng chảy (xấp xỉ, coi như không đổi theo áp suất). Chấm tròn: trạng thái buồng hiện tại.
          </p>
        </div>

        <div className="the-khac rounded-3xl p-6">
          <p className="chi-muc mb-4 text-shu-sang">Sổ liệu thật · {nt?.tenVi}</p>
          <dl className="space-y-3 font-mono text-sm">
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Điểm nóng chảy</dt>
              <dd className="text-right tabular-nums">{nt?.nongChayK} K · {nt ? denC(nt.nongChayK ?? 0) : ""}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Điểm sôi ({denAtm(apSuatAtm)} atm)</dt>
              <dd className="text-right tabular-nums">
                {soiKHieuDung != null ? soiKHieuDung.toFixed(1) : nt?.soiK} K · {nt ? denC(soiKHieuDung ?? nt.soiK ?? 0) : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-washi/8 pb-2">
              <dt className="text-washi-mo">Khối lượng riêng</dt>
              <dd className="text-right tabular-nums">{nt?.matDo ?? "—"} g/cm³</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-washi-mo">Trạng thái chuẩn (STP)</dt>
              <dd className="text-right tabular-nums">
                {nt?.trangThaiCertainty === "du-doan" ? "Dự đoán: " : ""}
                {nt?.trangThaiGoc}
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
