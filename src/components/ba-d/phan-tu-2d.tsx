"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { HopChat3D } from "@/lib/pubchem";
import { mauCua, useBanMauNguyenTo } from "./mat-phan-tu";

/** Máy/trình duyệt không có WebGL (GPU tích hợp đời cũ đã tắt, driver chặn…) */
export function coWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const khongDangKy = () => () => {};

/**
 * Phát hiện WebGL an toàn cho hydration: getServerSnapshot lạc quan trả về
 * true (giống lúc SSR không có document) nên khung hình đầu tiên trên client
 * luôn khớp HTML server — không dùng useState+useEffect vì gọi setState
 * trong effect gây thêm một lượt render không cần thiết (react-hooks/set-state-in-effect).
 */
export function useHoTroWebGL(): boolean {
  return useSyncExternalStore(khongDangKy, coWebGL, () => true);
}

function banKinhNguyenTu(so: number): number {
  return so === 1 ? 0.31 : so >= 9 && so <= 17 ? 0.46 : 0.415;
}

/**
 * Fallback khi không có WebGL: chiếu tọa độ 3D xuống mặt phẳng XY (bỏ z) và
 * vẽ SVG — phép chiếu trực giao thuần toán, không mất tính đúng đắn dữ liệu.
 * Thứ tự vẽ nguyên tử theo z (thuật toán họa sĩ) để lớp trước che lớp sau.
 */
export function PhanTu2D({ duLieu }: { duLieu: HopChat3D }) {
  const banMau = useBanMauNguyenTo();
  const { nguyenTu, lienKet, tenTruyVan } = duLieu;

  const { thuTuVe, khungNhin } = useMemo(() => {
    if (nguyenTu.length === 0) {
      return { thuTuVe: [] as number[], khungNhin: { x: -1, y: -1, w: 2, h: 2 } };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const nt of nguyenTu) {
      const banKinh = banKinhNguyenTu(nt.so);
      minX = Math.min(minX, nt.x - banKinh);
      maxX = Math.max(maxX, nt.x + banKinh);
      minY = Math.min(minY, -nt.y - banKinh);
      maxY = Math.max(maxY, -nt.y + banKinh);
    }
    const thuTuVe = nguyenTu.map((_, i) => i).sort((a, b) => nguyenTu[a].z - nguyenTu[b].z);
    return { thuTuVe, khungNhin: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
  }, [nguyenTu]);

  if (nguyenTu.length === 0) return null;

  return (
    <svg
      viewBox={`${khungNhin.x} ${khungNhin.y} ${khungNhin.w} ${khungNhin.h}`}
      className="h-full w-full"
      role="img"
      aria-label={`Sơ đồ phân tử 2D (chiếu trực giao, thay thế mô hình 3D) của ${tenTruyVan}: ${nguyenTu.length} nguyên tử, ${lienKet.length} liên kết`}
    >
      {lienKet.map((lk, i) => {
        const A = nguyenTu[lk.a];
        const B = nguyenTu[lk.b];
        if (!A || !B) return null;
        return (
          <line
            key={`lk-${i}`}
            x1={A.x} y1={-A.y} x2={B.x} y2={-B.y}
            stroke="rgba(242,234,217,0.55)"
            strokeWidth={lk.bac >= 2 ? 0.09 : 0.055}
          />
        );
      })}
      {thuTuVe.map((i) => {
        const nt = nguyenTu[i];
        return (
          <circle
            key={i}
            cx={nt.x} cy={-nt.y}
            r={banKinhNguyenTu(nt.so)}
            fill={mauCua(banMau, nt.so)}
            stroke="rgba(11,10,8,0.5)"
            strokeWidth={0.02}
          />
        );
      })}
    </svg>
  );
}
