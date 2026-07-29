"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Menu, X } from "lucide-react";
import { DIEU_HUONG } from "@/lib/site";
import NutCheDoTietKiem from "@/components/che-do-tiet-kiem";
import NutChuyenDong from "@/components/nut-chuyen-dong";

function DauAnEnso({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle
        cx="24" cy="24" r="20" fill="none"
        stroke="var(--color-shu-sang)" strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray="108 18" transform="rotate(-72 24 24)"
      />
      <g className="origin-center animate-xoay-cham" style={{ transformBox: "fill-box" }}>
        <ellipse cx="24" cy="24" rx="11" ry="4.2" fill="none" stroke="var(--color-kin)" strokeWidth="1.3" transform="rotate(28 24 24)" />
        <ellipse cx="24" cy="24" rx="11" ry="4.2" fill="none" stroke="var(--color-kin)" strokeWidth="1.3" transform="rotate(-38 24 24)" />
      </g>
      <circle cx="24" cy="24" r="2.6" fill="var(--color-washi)" />
    </svg>
  );
}

export default function DieuHuong() {
  const duong = usePathname();
  const [mo, setMo] = useState(false);
  const [cuon, setCuon] = useState(false);

  // Đóng menu di động khi đường dẫn đổi — điều chỉnh state khi props/route đổi,
  // làm ngay trong render thay vì effect để tránh render lồng nhau không cần thiết.
  const [duongTruoc, setDuongTruoc] = useState(duong);
  if (duong !== duongTruoc) {
    setDuongTruoc(duong);
    setMo(false);
  }

  useEffect(() => {
    const khi = () => setCuon(window.scrollY > 24);
    khi();
    window.addEventListener("scroll", khi, { passive: true });
    return () => window.removeEventListener("scroll", khi);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[80] print:hidden transition-all duration-500 ${
        cuon ? "bg-sumi/80 backdrop-blur-md border-b border-washi/10" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <DauAnEnso className="h-10 w-10 transition-transform duration-700 group-hover:rotate-[200deg]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-[0.18em] text-washi">
              KAGAKU
            </span>
            <span className="mt-1 text-[10px] tracking-[0.32em] text-washi-mo">
              科学 · PHÒNG THÍ NGHIỆM SỐ
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {DIEU_HUONG.map((muc) => {
            const dangO = muc.href === "/" ? duong === "/" : duong.startsWith(muc.href);
            return (
              <Link
                key={muc.href}
                href={muc.href}
                className={`group relative px-4 py-2 text-sm transition-colors ${
                  dangO ? "text-shu-sang" : "text-washi-mo hover:text-washi"
                }`}
              >
                <span className="gach-dong pb-1">{muc.nhan}</span>
                {dangO && (
                  <motion.span
                    layoutId="vach-dieu-huong"
                    className="absolute -bottom-[3px] left-1/2 h-[2px] w-6 -translate-x-1/2 bg-shu"
                  />
                )}
              </Link>
            );
          })}
          <NutChuyenDong className="ml-3" />
          <NutCheDoTietKiem className="ml-2" />
          <Link
            href="/thi-nghiem"
            className="nut-chu ml-3 inline-flex items-center gap-2 rounded-full bg-shu px-5 py-2.5 text-sm font-semibold shadow-[0_0_28px_rgba(214,59,31,0.35)] transition-transform hover:scale-[1.04] active:scale-95"
          >
            <FlaskConical size={16} strokeWidth={2.2} />
            Vào phòng thí nghiệm
          </Link>
        </div>

        <button
          onClick={() => setMo(true)}
          className="rounded-lg border border-washi/15 p-2 text-washi md:hidden"
          aria-label="Mở trình đơn"
        >
          <Menu size={20} />
        </button>
      </nav>

      <AnimatePresence>
        {mo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="nen-shoji fixed inset-0 z-[90] flex flex-col bg-sumi/97 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="font-display text-lg font-bold tracking-[0.18em]">KAGAKU 科学</span>
              <button
                onClick={() => setMo(false)}
                className="rounded-lg border border-washi/15 p-2"
                aria-label="Đóng trình đơn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 px-8">
              {DIEU_HUONG.map((muc, i) => (
                <motion.div
                  key={muc.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={muc.href}
                    className="group flex items-baseline gap-4 border-b border-washi/10 py-5"
                  >
                    <span className="chi-muc text-shu-sang">{muc.kanji}</span>
                    <span className="font-display text-3xl font-semibold text-washi group-hover:text-shu-sang">
                      {muc.nhan}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 px-8 pb-6">
              <NutChuyenDong />
              <NutCheDoTietKiem />
            </div>
            <p className="px-8 pb-10 text-xs leading-relaxed text-washi-mo">
              Dữ liệu hóa học đồng bộ từ PubChem PUG-REST — NCBI, cache có kiểm soát.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
