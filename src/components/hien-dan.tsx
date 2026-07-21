"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface ThuocTinhHienDan {
  children: ReactNode;
  className?: string;
  tre?: number;
  len?: number;
}

/** Hiệu ứng tái hiện mượt khi cuộn tới — dịch lên + mờ + nuốt nhẹ */
export default function HienDan({ children, className, tre = 0, len = 36 }: ThuocTinhHienDan) {
  const giam = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={giam ? undefined : { opacity: 0, y: len, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: tre, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
