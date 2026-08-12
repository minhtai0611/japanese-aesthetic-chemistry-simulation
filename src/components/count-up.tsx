"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  // Real value from the very first render (SSR) — the count-up animation is
  // purely a decorative flourish on scroll-into-view, never the source of truth
  // for the number itself.
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const durationMs = 1800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setCurrent(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const formatted =
    value >= 1000
      ? Math.floor(current).toLocaleString("vi-VN")
      : current.toLocaleString("vi-VN", { maximumFractionDigits: value % 1 ? 1 : 0 });

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
