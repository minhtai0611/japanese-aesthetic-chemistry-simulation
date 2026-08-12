"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { suggestClosestMatch } from "@/lib/levenshtein";
import { FEATURED_COMPOUNDS } from "@/lib/featured-compounds";
import { COMPOUND_ALIASES } from "@/lib/compound-alias";
import { VIETNAMESE_NAMES } from "@/lib/element";
import { slugifyCompound } from "@/lib/slug";

/** Static suggestion catalog — no PubChem call, no AI, just classic Levenshtein matching */
const COMPOUND_CANDIDATES = [
  ...new Set([...FEATURED_COMPOUNDS.map((c) => c.name), ...Object.keys(COMPOUND_ALIASES)]),
];
const ELEMENT_CANDIDATES = Object.values(VIETNAMESE_NAMES);

export default function NotFound() {
  const pathname = usePathname();

  const suggestions = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) return [];

    const keyword = decodeURIComponent(segments[segments.length - 1]).replace(/-/g, " ");

    if (segments[0] === "compound") {
      return suggestClosestMatch(keyword, COMPOUND_CANDIDATES).map((name) => ({
        label: name,
        href: `/compound/${slugifyCompound(name)}`,
      }));
    }
    if (segments[0] === "element") {
      return suggestClosestMatch(keyword, ELEMENT_CANDIDATES).map((name) => ({
        label: name,
        href: `/periodic-table?q=${encodeURIComponent(name)}`,
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

      {suggestions.length > 0 && (
        <div className="the-khac mt-8 rounded-2xl p-6 text-left">
          <p className="chi-muc mb-3 text-shu-sang">Có phải bạn muốn tìm</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-full border border-washi/12 px-4 py-2 text-xs capitalize text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {s.label}
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
