"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function DemTang({
  den,
  tien = "",
  hau = "",
  className = "",
}: {
  den: number;
  tien?: string;
  hau?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const trongTamNhin = useInView(ref, { once: true, margin: "-60px" });
  // Giá trị thật ngay từ lần render đầu (SSR) — animation đếm lên chỉ là hiệu ứng
  // tô điểm khi cuộn tới, không phải nguồn sự thật của con số.
  const [giaTri, setGiaTri] = useState(den);

  useEffect(() => {
    if (!trongTamNhin) return;
    const batDau = performance.now();
    const taoBong = 1800;
    let raf = 0;
    const chay = (bay: number) => {
      const t = Math.min((bay - batDau) / taoBong, 1);
      const mem = 1 - Math.pow(1 - t, 4);
      setGiaTri(den * mem);
      if (t < 1) raf = requestAnimationFrame(chay);
    };
    raf = requestAnimationFrame(chay);
    return () => cancelAnimationFrame(raf);
  }, [trongTamNhin, den]);

  const dinhDang =
    den >= 1000
      ? Math.floor(giaTri).toLocaleString("vi-VN")
      : giaTri.toLocaleString("vi-VN", { maximumFractionDigits: den % 1 ? 1 : 0 });

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {tien}
      {dinhDang}
      {hau}
    </span>
  );
}
