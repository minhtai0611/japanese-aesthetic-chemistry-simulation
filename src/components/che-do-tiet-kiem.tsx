"use client";

import { useCallback, useSyncExternalStore } from "react";
import { BatteryCharging } from "lucide-react";

const KHOA = "kagaku-tiet-kiem";
const SU_KIEN = "kagaku-tiet-kiem-doi";

function docLuuTru(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KHOA) === "1";
}

/**
 * Chế độ tiết kiệm: tắt hero 3D, tắt postprocessing, giảm số hạt mô phỏng.
 * Lưu vào localStorage và phát sự kiện tuỳ chỉnh để mọi component đang mở
 * (cùng tab) cập nhật ngay — "storage" event của trình duyệt chỉ bắn ở các
 * tab KHÁC, không bắn ở chính tab vừa ghi.
 */
export function useCheDoTietKiem(): [boolean, (bat: boolean) => void] {
  const bat = useSyncExternalStore(
    (goi) => {
      window.addEventListener(SU_KIEN, goi);
      window.addEventListener("storage", goi);
      return () => {
        window.removeEventListener(SU_KIEN, goi);
        window.removeEventListener("storage", goi);
      };
    },
    docLuuTru,
    () => false,
  );

  const dat = useCallback((v: boolean) => {
    window.localStorage.setItem(KHOA, v ? "1" : "0");
    window.dispatchEvent(new Event(SU_KIEN));
  }, []);

  return [bat, dat];
}

export default function NutCheDoTietKiem({ className = "" }: { className?: string }) {
  const [bat, dat] = useCheDoTietKiem();
  return (
    <button
      type="button"
      onClick={() => dat(!bat)}
      aria-pressed={bat}
      title="Chế độ tiết kiệm: tắt nền 3D, giảm số hạt mô phỏng — phù hợp máy yếu hoặc mạng chậm"
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
        bat
          ? "border-tokiwa/50 bg-tokiwa/15 text-tokiwa"
          : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
      } ${className}`}
    >
      <BatteryCharging size={14} />
      {bat ? "Đang tiết kiệm" : "Tiết kiệm"}
    </button>
  );
}
