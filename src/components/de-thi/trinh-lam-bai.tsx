"use client";

import { useState } from "react";
import { Check, Loader2, Send, X } from "lucide-react";

interface CauHoi {
  id: number;
  thuTu: number;
  de: string;
}

interface KetQuaCauHoi {
  baiTapId: number;
  thuTu: number;
  dung: boolean;
  dapAn: number;
  loiGiai: string;
}

export default function TrinhLamBai({ ma, cauHoi }: { ma: string; cauHoi: CauHoi[] }) {
  const [traLoi, setTraLoi] = useState<Record<number, string>>({});
  const [dangNop, setDangNop] = useState(false);
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState<Map<number, KetQuaCauHoi> | null>(null);

  const nop = async () => {
    setDangNop(true);
    setLoi("");
    try {
      const body = {
        traLoi: cauHoi
          .filter((c) => traLoi[c.id] !== undefined && traLoi[c.id].trim() !== "")
          .map((c) => ({ baiTapId: c.id, traLoi: Number(traLoi[c.id]) })),
      };
      if (body.traLoi.length === 0) {
        setLoi("Điền ít nhất một câu trước khi nộp.");
        return;
      }
      const r = await fetch(`/api/de/${ma}/nop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.loi ?? "Không nộp được bài — thử lại.");
      setKetQua(new Map(d.ketQua.map((k: KetQuaCauHoi) => [k.baiTapId, k])));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Lỗi không rõ — thử lại.");
    } finally {
      setDangNop(false);
    }
  };

  const soDung = ketQua ? [...ketQua.values()].filter((k) => k.dung).length : null;

  return (
    <div className="space-y-4">
      {soDung !== null && (
        <div className="the-khac rounded-2xl p-5 text-center" aria-live="polite">
          <p className="font-display text-2xl font-bold text-shu-sang">
            Đúng {soDung}/{ketQua!.size} câu đã nộp
          </p>
        </div>
      )}

      {cauHoi.map((c) => {
        const kq = ketQua?.get(c.id);
        return (
          <div key={c.id} className="the-khac rounded-2xl p-5">
            <p className="text-sm leading-relaxed text-washi">
              <span className="chi-muc mr-2 text-kin">Câu {c.thuTu}</span>
              {c.de}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={traLoi[c.id] ?? ""}
                onChange={(e) => setTraLoi((t) => ({ ...t, [c.id]: e.target.value }))}
                disabled={!!ketQua}
                placeholder="Nhập số…"
                aria-label={`Câu trả lời cho câu ${c.thuTu}`}
                className="the-khac w-40 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-60"
              />
              {kq && (
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${kq.dung ? "text-tokiwa" : "text-shu-sang"}`}>
                  {kq.dung ? <Check size={16} /> : <X size={16} />}
                  {kq.dung ? "Đúng" : `Sai — đáp án ${kq.dapAn}`}
                </span>
              )}
            </div>
            {kq && !kq.dung && (
              <p className="mt-3 whitespace-pre-line font-mono text-xs leading-relaxed text-washi-mo">{kq.loiGiai}</p>
            )}
          </div>
        );
      })}

      {loi && <p className="text-sm text-shu-sang">{loi}</p>}

      {!ketQua && (
        <button
          type="button"
          onClick={() => void nop()}
          disabled={dangNop}
          className="nut-chu flex w-full items-center justify-center gap-2 rounded-full bg-shu px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {dangNop ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {dangNop ? "Đang nộp…" : "Nộp bài"}
        </button>
      )}
    </div>
  );
}
