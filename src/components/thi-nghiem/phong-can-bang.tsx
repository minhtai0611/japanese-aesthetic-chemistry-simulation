"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, Sigma } from "lucide-react";
import { canBang, type KetQuaCanBang } from "@/lib/hoa-hoc/can-bang";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";
import { tinhKhoiLuongMol, bangKhoiLuongTheoKyHieu } from "@/lib/hoa-hoc/khoi-luong-mol";
import type { NguyenTo } from "@/lib/pubchem";

const VI_DU = [
  { trai: "H2 + O2", phai: "H2O" },
  { trai: "Fe + O2", phai: "Fe2O3" },
  { trai: "C3H8 + O2", phai: "CO2 + H2O" },
  { trai: "KMnO4 + HCl", phai: "KCl + MnCl2 + Cl2 + H2O" },
  { trai: "Ca(OH)2 + H3PO4", phai: "Ca3(PO4)2 + H2O" },
];

function tachChat(input: string): string[] {
  return input
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function voiChiSo(ct: string) {
  return ct.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>));
}

export default function PhongCanBang() {
  const [veTraiNhap, setVeTraiNhap] = useState(VI_DU[0].trai);
  const [vePhaiNhap, setVePhaiNhap] = useState(VI_DU[0].phai);
  const [ketQua, setKetQua] = useState<KetQuaCanBang | null>(null);
  const [nguyenTo, setNguyenTo] = useState<NguyenTo[] | null>(null);

  useEffect(() => {
    let huy = false;
    fetch("/api/danh-sach-nguyen-to")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NguyenTo[] | null) => {
        if (!huy && d) setNguyenTo(d);
      })
      .catch(() => {
        /* Khối lượng nguyên tử chỉ để hiện thêm bảo toàn khối lượng — không có cũng không sao */
      });
    return () => {
      huy = true;
    };
  }, []);

  const bangKL = useMemo(() => (nguyenTo ? bangKhoiLuongTheoKyHieu(nguyenTo) : null), [nguyenTo]);

  const tinhCanBang = () => {
    const veTrai = tachChat(veTraiNhap);
    const vePhai = tachChat(vePhaiNhap);
    setKetQua(canBang(veTrai, vePhai));
  };

  const veTraiChat = tachChat(veTraiNhap);
  const vePhaiChat = tachChat(vePhaiNhap);

  const khoiLuongMoiVe = (chat: string[], heSo?: number[]) => {
    if (!bangKL || !heSo) return null;
    try {
      return chat.reduce((tong, ct, i) => tong + tinhKhoiLuongMol(phanTichCongThuc(ct), bangKL) * heSo[i], 0);
    } catch {
      return null;
    }
  };

  const mTrai = ketQua?.ok ? khoiLuongMoiVe(veTraiChat, ketQua.heSoTrai) : null;
  const mPhai = ketQua?.ok ? khoiLuongMoiVe(vePhaiChat, ketQua.heSoPhai) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
      <div className="the-khac rounded-3xl p-5 sm:p-7">
        <p className="chi-muc mb-4 text-shu-sang">Nhập phương trình chưa cân bằng</p>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-washi-mo" htmlFor="ve-trai">
              Vế trái (chất phản ứng, ngăn cách bằng dấu +)
            </label>
            <div className="the-khac rounded-2xl px-5 py-3.5">
              <input
                id="ve-trai"
                value={veTraiNhap}
                onChange={(e) => {
                  setVeTraiNhap(e.target.value);
                  setKetQua(null);
                }}
                placeholder="Fe + O2"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-washi-mo/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-washi-mo" htmlFor="ve-phai">
              Vế phải (sản phẩm)
            </label>
            <div className="the-khac rounded-2xl px-5 py-3.5">
              <input
                id="ve-phai"
                value={vePhaiNhap}
                onChange={(e) => {
                  setVePhaiNhap(e.target.value);
                  setKetQua(null);
                }}
                placeholder="Fe2O3"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-washi-mo/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={tinhCanBang}
          className="nut-chu mt-5 flex items-center gap-2 rounded-full bg-shu px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Scale size={16} />
          Cân bằng phương trình
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          {VI_DU.map((vd) => (
            <button
              key={vd.trai}
              onClick={() => {
                setVeTraiNhap(vd.trai);
                setVePhaiNhap(vd.phai);
                setKetQua(null);
              }}
              className="rounded-full border border-washi/12 px-3.5 py-1.5 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
            >
              {vd.trai} → {vd.phai}
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-washi-mo/80">
          Cân bằng bằng khử Gauss-Jordan trên số hữu tỉ (bigint), không dùng AI, không đoán —
          xem src/lib/hoa-hoc/can-bang.ts.
        </p>
      </div>

      <div className="the-khac relative flex flex-col justify-center rounded-3xl p-6 sm:p-8">
        <p className="chu-doc absolute right-5 top-6 text-[10px] text-washi/25">均衡 — cân bằng</p>

        {!ketQua && (
          <div className="text-center text-washi-mo">
            <Sigma size={36} className="mx-auto mb-3 text-washi/20" />
            <p className="text-sm">Nhập phương trình rồi bấm &ldquo;Cân bằng phương trình&rdquo;.</p>
          </div>
        )}

        {ketQua && !ketQua.ok && (
          <div role="alert" className="rounded-2xl border border-shu-sang/40 bg-shu/10 p-5 text-center">
            <p className="font-semibold text-shu-sang">Không cân bằng được</p>
            <p className="mt-2 text-sm text-washi-mo">{ketQua.lyDo}</p>
          </div>
        )}

        {ketQua?.ok && (
          <div className="text-center">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 font-display text-2xl font-bold sm:text-3xl">
              {veTraiChat.map((ct, i) => (
                <span key={`t${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-washi-mo">+</span>}
                  <span className="text-kin">{ketQua.heSoTrai[i] > 1 ? ketQua.heSoTrai[i] : ""}</span>
                  <span>{voiChiSo(ct)}</span>
                </span>
              ))}
              <span className="mx-1 text-shu-sang">→</span>
              {vePhaiChat.map((ct, i) => (
                <span key={`p${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-washi-mo">+</span>}
                  <span className="text-kin">{ketQua.heSoPhai[i] > 1 ? ketQua.heSoPhai[i] : ""}</span>
                  <span>{voiChiSo(ct)}</span>
                </span>
              ))}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-washi-mo">
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                Hệ số trái: {ketQua.heSoTrai.join(", ")}
              </span>
              <span className="rounded-full border border-washi/12 px-3 py-1.5">
                Hệ số phải: {ketQua.heSoPhai.join(", ")}
              </span>
            </div>

            {mTrai != null && mPhai != null && (
              <p className="mt-5 font-mono text-[11px] text-washi-mo/80">
                Bảo toàn khối lượng (khối lượng nguyên tử thật từ PubChem):{" "}
                <strong className="text-washi">{mTrai.toFixed(2)} g</strong> ={" "}
                <strong className="text-washi">{mPhai.toFixed(2)} g</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
