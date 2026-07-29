"use client";

import { useState } from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import type { SlugPhong } from "@/lib/phong-thi-nghiem";

type TrangThai = "cho" | "dang-luu" | "da-luu" | "loi";

export default function NutLuuSoTay({
  loaiPhong,
  tieuDe,
  thamSo,
  ketQua,
  className = "",
}: {
  loaiPhong: SlugPhong;
  tieuDe: string;
  thamSo: Record<string, unknown>;
  ketQua: Record<string, unknown>;
  className?: string;
}) {
  const [trangThai, setTrangThai] = useState<TrangThai>("cho");

  const luu = async () => {
    setTrangThai("dang-luu");
    try {
      const r = await fetch("/api/so-tay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loaiPhong, tieuDe, thamSo, ketQua }),
      });
      if (!r.ok) throw new Error();
      setTrangThai("da-luu");
    } catch {
      setTrangThai("loi");
    } finally {
      setTimeout(() => setTrangThai("cho"), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void luu()}
      disabled={trangThai === "dang-luu"}
      className={`flex items-center gap-2 rounded-full border border-washi/20 px-4 py-2 text-xs font-medium text-washi-mo transition-colors hover:border-kin hover:text-kin disabled:opacity-60 ${className}`}
    >
      {trangThai === "dang-luu" ? (
        <Loader2 size={13} className="animate-spin" />
      ) : trangThai === "da-luu" ? (
        <Check size={13} className="text-tokiwa" />
      ) : (
        <BookmarkPlus size={13} />
      )}
      {trangThai === "da-luu" ? "Đã lưu vào sổ tay" : trangThai === "loi" ? "Lưu lỗi — thử lại" : "Lưu vào sổ tay"}
    </button>
  );
}
