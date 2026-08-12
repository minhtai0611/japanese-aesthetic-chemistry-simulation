"use client";

import { Waves, Zap } from "lucide-react";
import { useSetReducedMotionManual, usePrefersReducedMotion } from "@/lib/use-motion";

export default function MotionToggleButton({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const setReduced = useSetReducedMotionManual();

  return (
    <button
      type="button"
      onClick={() => setReduced(!reduced)}
      aria-pressed={reduced}
      title="Bật/tắt chuyển động và hiệu ứng 3D — không cần đổi cài đặt hệ điều hành"
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
        reduced
          ? "border-kin/50 bg-kin/15 text-kin"
          : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
      } ${className}`}
    >
      {reduced ? <Waves size={14} /> : <Zap size={14} />}
      {reduced ? "Chuyển động: Đã giảm" : "Chuyển động: Đầy đủ"}
    </button>
  );
}
