"use client";

import { Printer } from "lucide-react";

export default function NutIn() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="nut-chu flex items-center gap-2 rounded-full bg-shu px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95 print:hidden"
    >
      <Printer size={16} />
      In / Lưu PDF
    </button>
  );
}
