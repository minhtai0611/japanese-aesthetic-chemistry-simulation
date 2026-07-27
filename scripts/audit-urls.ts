/**
 * Quét toàn bộ bề mặt URL mà người dùng THẬT sẽ chạm tới:
 *   1. Toàn bộ khóa alias tiếng Việt trong alias-hop-chat.ts
 *   2. Toàn bộ hợp chất trong HOP_CHAT_NOI_BAT
 *   3. Toàn bộ 118 nguyên tố
 *   4. Chất phổ thông (danh pháp VN + tên IUPAC có gạch nối) + bẫy URL vô hạn
 *
 * Dùng: npx tsx scripts/audit-urls.ts [baseUrl]
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { ALIAS_HOP_CHAT } from "../src/lib/alias-hop-chat";
import { HOP_CHAT_NOI_BAT } from "../src/lib/hop-chat-noi-bat";
import { slugHoaHopChat } from "../src/lib/slug";

const BASE = process.argv[2] ?? "http://localhost:3000";

/** Semaphore tôn trọng máy chủ đích (<= 4 req đồng thời) */
async function chayTuanTu<T, R>(
  items: T[],
  fn: (t: T) => Promise<R>,
  batch = 4,
  nghi = 300,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batch) {
    out.push(...(await Promise.all(items.slice(i, i + batch).map(fn))));
    await new Promise((s) => setTimeout(s, nghi));
  }
  return out;
}

type KetQua = { nhom: string; tuKhoa: string; url: string; status: number; nonLatin1: boolean };

async function thu(nhom: string, tuKhoa: string, url: string): Promise<KetQua> {
  const status = await fetch(`${BASE}${url}`)
    .then((r) => r.status)
    .catch(() => 0);
  return { nhom, tuKhoa, url, status, nonLatin1: [...tuKhoa].some((c) => c.codePointAt(0)! > 0xff) };
}

const CHAT_PHO_THONG = [
  "nước",
  "muối ăn",
  "đường",
  "axit sunfuric",
  "natri hidroxit",
  "canxi cacbonat",
  "amoniac",
  "metan",
  "etanol",
  "axit axetic",
  "glucozơ",
  "saccarozơ",
  "vitamin c",
  "paracetamol",
  "sắt(III) oxit",
  "đồng sunfat",
  "kali pemanganat",
  "bạc nitrat",
  "axit clohidric",
  "natri clorua",
  "canxi oxit",
  // Danh pháp IUPAC có gạch nối — kiểm boSlugHopChat có phá không
  "1,3,7-trimethylxanthine",
  "cis-platin",
  "n-hexane",
  "sec-butanol",
  "D-fructose",
  "2-deoxy-D-ribose",
  "beta-D-glucose",
  "alpha-tocopherol",
  "p-xylene",
  "N,N-dimethylformamide",
  "tert-butanol",
  "trans-2-butene",
  // Từ tiếng Anh thường — kiểm bẫy URL vô hạn
  "love",
  "sunshine",
  "happy",
  "banana",
  "tree",
  "gold",
];

const NGUYEN_TO =
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(
    " ",
  );

async function main() {
  const nhiemVu: [string, string, string][] = [
    ...Object.keys(ALIAS_HOP_CHAT).map(
      (k) => ["alias", k, `/hop-chat/${slugHoaHopChat(k)}`] as [string, string, string],
    ),
    ...HOP_CHAT_NOI_BAT.map(
      (c) => ["noi-bat", c.ten, `/hop-chat/${slugHoaHopChat(c.ten)}`] as [string, string, string],
    ),
    ...NGUYEN_TO.map((s) => ["nguyen-to", s, `/nguyen-to/${s.toLowerCase()}`] as [string, string, string]),
    ...CHAT_PHO_THONG.map(
      (c) => ["pho-thong", c, `/hop-chat/${slugHoaHopChat(c)}`] as [string, string, string],
    ),
  ];

  const kq = await chayTuanTu(nhiemVu, ([n, t, u]) => thu(n, t, u));

  const loi5xx = kq.filter((r) => r.status >= 500);
  const loi404 = kq.filter((r) => r.status === 404);
  const ok = kq.filter((r) => r.status === 200);

  const theoNhom = new Map<string, { ok: number; e404: number; e5xx: number; tong: number }>();
  for (const r of kq) {
    const e = theoNhom.get(r.nhom) ?? { ok: 0, e404: 0, e5xx: 0, tong: 0 };
    e.tong++;
    if (r.status === 200) e.ok++;
    else if (r.status === 404) e.e404++;
    else if (r.status >= 500) e.e5xx++;
    theoNhom.set(r.nhom, e);
  }

  const md = [
    `# Báo cáo quét URL — KAGAKU`,
    ``,
    `- Base: \`${BASE}\``,
    `- Tổng URL: **${kq.length}**`,
    `- 200 OK: **${ok.length}** · 404: **${loi404.length}** · **5xx: ${loi5xx.length}**`,
    ``,
    `## Theo nhóm`,
    ``,
    `| Nhóm | 200 | 404 | 5xx | Tổng |`,
    `|---|---|---|---|---|`,
    ...[...theoNhom].map(([n, e]) => `| ${n} | ${e.ok} | ${e.e404} | **${e.e5xx}** | ${e.tong} |`),
    ``,
    `## 🔴 Lỗi 5xx (server sập)`,
    ``,
    `| Từ khoá | URL | Status | Có ký tự > U+00FF |`,
    `|---|---|---|---|`,
    ...loi5xx.map(
      (r) => `| \`${r.tuKhoa}\` | \`${r.url}\` | ${r.status} | ${r.nonLatin1 ? "**CÓ**" : "không"} |`,
    ),
    ``,
    `## 404`,
    ``,
    `| Nhóm | Từ khoá | URL |`,
    `|---|---|---|`,
    ...loi404.map((r) => `| ${r.nhom} | \`${r.tuKhoa}\` | \`${r.url}\` |`),
  ].join("\n");

  writeFileSync("docs/url-audit.md", md);
  console.log(`Tổng ${kq.length} · 200=${ok.length} · 404=${loi404.length} · 5xx=${loi5xx.length}`);
  console.log(
    `Trong đó ${loi5xx.filter((r) => r.nonLatin1).length}/${loi5xx.length} lỗi 5xx có ký tự > U+00FF`,
  );
}

main();
