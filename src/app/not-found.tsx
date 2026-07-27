"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { goiYGanDung } from "@/lib/levenshtein";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";
import { ALIAS_HOP_CHAT } from "@/lib/alias-hop-chat";
import { TEN_VI } from "@/lib/nguyen-to";
import { slugHoaHopChat } from "@/lib/slug";

/** Danh mục tra gợi ý tĩnh — không gọi PubChem, không AI, chỉ so khớp Levenshtein cổ điển */
const UNG_VIEN_HOP_CHAT = [
  ...new Set([...HOP_CHAT_NOI_BAT.map((c) => c.ten), ...Object.keys(ALIAS_HOP_CHAT)]),
];
const UNG_VIEN_NGUYEN_TO = Object.values(TEN_VI);

export default function KhongTimThay() {
  const pathname = usePathname();

  const goiY = useMemo(() => {
    const doan = pathname.split("/").filter(Boolean);
    if (doan.length < 2) return [];

    const tuKhoa = decodeURIComponent(doan[doan.length - 1]).replace(/-/g, " ");

    if (doan[0] === "hop-chat") {
      return goiYGanDung(tuKhoa, UNG_VIEN_HOP_CHAT).map((ten) => ({
        nhan: ten,
        href: `/hop-chat/${slugHoaHopChat(ten)}`,
      }));
    }
    if (doan[0] === "nguyen-to") {
      return goiYGanDung(tuKhoa, UNG_VIEN_NGUYEN_TO).map((ten) => ({
        nhan: ten,
        href: `/bang-tuan-hoan?q=${encodeURIComponent(ten)}`,
      }));
    }
    return [];
  }, [pathname]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="chu-doc mx-auto mb-6 text-sm text-washi/40" lang="ja">
        不明
      </p>
      <h1 className="font-display text-3xl font-bold text-washi">Không tìm thấy trang này</h1>
      <p className="mt-4 leading-relaxed text-washi-mo">
        Đường dẫn không tồn tại, hoặc chất bạn tìm chưa có trong CSDL PubChem.
      </p>

      {goiY.length > 0 && (
        <div className="the-khac mt-8 rounded-2xl p-6 text-left">
          <p className="chi-muc mb-3 text-shu-sang">Có phải bạn muốn tìm</p>
          <div className="flex flex-wrap gap-2">
            {goiY.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="rounded-full border border-washi/12 px-4 py-2 text-xs capitalize text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {g.nhan}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link href="/" className="nut-chu mt-8 inline-block rounded-full bg-shu px-7 py-3.5 font-semibold">
        Về trang chủ
      </Link>
    </main>
  );
}
