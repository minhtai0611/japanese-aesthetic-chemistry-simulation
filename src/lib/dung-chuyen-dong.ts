"use client";

import { useCallback, useSyncExternalStore } from "react";

const KHOA = "kagaku-giam-chuyen-dong"; // "1" | "0" | vắng mặt = theo hệ điều hành
const SU_KIEN = "kagaku-giam-chuyen-dong-doi";

const mql = () => (typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)"));

function docGhiDe(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KHOA);
  return v === "1" ? true : v === "0" ? false : null;
}

/**
 * Người dùng có yêu cầu giảm chuyển động không? Ưu tiên lựa chọn tự tay
 * trong UI (nút hiện trong menu — không phải ai cũng biết bật ở OS), lưu
 * localStorage; nếu chưa từng bấm thì theo mặc định hệ điều hành/trình duyệt.
 *
 * KHÁC với CSS @media (prefers-reduced-motion): CSS animation-duration không
 * chạm được tới requestAnimationFrame/useFrame của three.js — hook này đọc
 * trực tiếp qua useSyncExternalStore, cho phép DỪNG HẲN render loop
 * (Canvas frameloop="demand", huỷ requestAnimationFrame thủ công…) chứ
 * không chỉ tắt animation CSS.
 */
export function useGiamChuyenDong(): boolean {
  return useSyncExternalStore(
    (goi) => {
      const m = mql();
      m?.addEventListener("change", goi);
      window.addEventListener(SU_KIEN, goi);
      window.addEventListener("storage", goi);
      return () => {
        m?.removeEventListener("change", goi);
        window.removeEventListener(SU_KIEN, goi);
        window.removeEventListener("storage", goi);
      };
    },
    () => docGhiDe() ?? mql()?.matches ?? false,
    () => false,
  );
}

/** Ghi đè thủ công lựa chọn giảm chuyển động — dùng cho nút bật/tắt hiển thị trong UI. */
export function useDatGiamChuyenDongThuCong(): (bat: boolean) => void {
  return useCallback((bat: boolean) => {
    window.localStorage.setItem(KHOA, bat ? "1" : "0");
    window.dispatchEvent(new Event(SU_KIEN));
  }, []);
}
