"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * true kể từ lần đầu phần tử lọt vào khung nhìn (biên `rootMargin` để bắt đầu
 * tải sớm một chút trước khi thật sự cuộn tới) — sau đó giữ nguyên true dù
 * cuộn ra ngoài lại, vì Canvas 3D một khi đã tải xuống thì không có lý do
 * tháo lại. Môi trường không có IntersectionObserver (SSR, trình duyệt cũ)
 * coi như đã hiển thị luôn, để không khoá vĩnh viễn ở 2D.
 */
export function useIntersectionObserver(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [dangHienThi, setDangHienThi] = useState(false);

  useEffect(() => {
    if (dangHienThi) return;
    const nut = ref.current;
    if (!nut || typeof IntersectionObserver === "undefined") {
      setDangHienThi(true);
      return;
    }
    const quanSat = new IntersectionObserver(
      ([muc]) => {
        if (muc?.isIntersecting) setDangHienThi(true);
      },
      { rootMargin },
    );
    quanSat.observe(nut);
    return () => quanSat.disconnect();
  }, [dangHienThi, rootMargin]);

  return { ref, dangHienThi };
}

/**
 * Bọc quanh nội dung 3D (three.js/@react-three/fiber): mặc định vẽ `render2D`
 * (tĩnh/SVG, không tải chunk three.js), chỉ đổi sang `render3D` khi phần tử
 * lọt khung nhìn HOẶC người dùng bấm nút kích hoạt (nếu `choKichHoatThuCong`).
 * `bat2D` (chế độ tiết kiệm hoặc máy không hỗ trợ WebGL) tắt hẳn cơ chế kích
 * hoạt — giữ 2D vĩnh viễn, tuyệt đối không có đường nào bật lại WebGL.
 */
export function LazyCanvasWrapper({
  bat2D,
  render2D,
  render3D,
  choKichHoatThuCong = false,
  nhanKichHoat = "Bật tương tác 3D xoay chiều",
  className = "absolute inset-0",
}: {
  bat2D: boolean;
  render2D: () => ReactNode;
  render3D: () => ReactNode;
  choKichHoatThuCong?: boolean;
  nhanKichHoat?: string;
  className?: string;
}) {
  const { ref, dangHienThi } = useIntersectionObserver();
  const [kichHoatThuCong, setKichHoatThuCong] = useState(false);
  const hienThi3D = !bat2D && (dangHienThi || kichHoatThuCong);

  return (
    <div ref={ref} className={className}>
      {hienThi3D ? render3D() : render2D()}
      {!bat2D && !hienThi3D && choKichHoatThuCong && (
        <button
          type="button"
          onClick={() => setKichHoatThuCong(true)}
          className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs text-washi-mo backdrop-blur transition-colors hover:border-shu-sang hover:text-washi"
        >
          {nhanKichHoat}
        </button>
      )}
    </div>
  );
}
