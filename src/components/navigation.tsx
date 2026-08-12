"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Menu, X } from "lucide-react";
import { NAVIGATION } from "@/lib/site";
import DataSaverModeButton from "@/components/data-saver-mode";
import MotionToggleButton from "@/components/motion-toggle-button";

function EnsoMark({ className = "" }: { className?: string }) {
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

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu when the route changes — adjust state during
  // render when props/route change, instead of an effect, to avoid an
  // unnecessary extra render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[80] transition-all duration-500 ${
        scrolled ? "bg-sumi/80 backdrop-blur-md border-b border-washi/10" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <EnsoMark className="h-10 w-10 transition-transform duration-700 group-hover:rotate-[200deg]" />
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
          {NAVIGATION.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative px-4 py-2 text-sm transition-colors ${
                  isActive ? "text-shu-sang" : "text-washi-mo hover:text-washi"
                }`}
              >
                <span className="gach-dong pb-1">{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-[3px] left-1/2 h-[2px] w-6 -translate-x-1/2 bg-shu"
                  />
                )}
              </Link>
            );
          })}
          <MotionToggleButton className="ml-3" />
          <DataSaverModeButton className="ml-2" />
          <Link
            href="/experiments"
            className="nut-chu ml-3 inline-flex items-center gap-2 rounded-full bg-shu px-5 py-2.5 text-sm font-semibold shadow-[0_0_28px_rgba(214,59,31,0.35)] transition-transform hover:scale-[1.04] active:scale-95"
          >
            <FlaskConical size={16} strokeWidth={2.2} />
            Vào phòng thí nghiệm
          </Link>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg border border-washi/15 p-2 text-washi md:hidden"
          aria-label="Mở trình đơn"
        >
          <Menu size={20} />
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
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
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-washi/15 p-2"
                aria-label="Đóng trình đơn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 px-8">
              {NAVIGATION.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    className="group flex items-baseline gap-4 border-b border-washi/10 py-5"
                  >
                    <span className="chi-muc text-shu-sang">{item.kanji}</span>
                    <span className="font-display text-3xl font-semibold text-washi group-hover:text-shu-sang">
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 px-8 pb-6">
              <MotionToggleButton />
              <DataSaverModeButton />
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
