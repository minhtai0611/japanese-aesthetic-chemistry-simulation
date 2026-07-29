"use client";

import { Waves, Zap } from "lucide-react";
import { useDatGiamChuyenDongThuCong, useGiamChuyenDong } from "@/lib/dung-chuyen-dong";

export default function NutChuyenDong({ className = "" }: { className?: string }) {
  const giam = useGiamChuyenDong();
  const dat = useDatGiamChuyenDongThuCong();

  return (
    <button
      type="button"
      onClick={() => dat(!giam)}
      aria-pressed={giam}
      title="Bật/tắt chuyển động và hiệu ứng 3D — không cần đổi cài đặt hệ điều hành"
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
        giam
          ? "border-kin/50 bg-kin/15 text-kin"
          : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
      } ${className}`}
    >
      {giam ? <Waves size={14} /> : <Zap size={14} />}
      {giam ? "Chuyển động: Đã giảm" : "Chuyển động: Đầy đủ"}
    </button>
  );
}
