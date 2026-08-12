/**
 * Scans the entire URL surface REAL users will hit:
 *   1. Every Vietnamese alias key in compound-alias.ts
 *   2. Every compound in FEATURED_COMPOUNDS
 *   3. All 118 elements
 *   4. Common substances (VN nomenclature + hyphenated IUPAC names) + an infinite-URL trap check
 *
 * Usage: npx tsx scripts/audit-urls.ts [baseUrl]
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { COMPOUND_ALIASES } from "../src/lib/compound-alias";
import { FEATURED_COMPOUNDS } from "../src/lib/featured-compounds";
import { slugifyCompound } from "../src/lib/slug";

const BASE = process.argv[2] ?? "http://localhost:3000";

/** Semaphore that's polite to the target server (<= 4 concurrent requests) */
async function runSequentially<T, R>(
  items: T[],
  fn: (t: T) => Promise<R>,
  batch = 4,
  pause = 300,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batch) {
    out.push(...(await Promise.all(items.slice(i, i + batch).map(fn))));
    await new Promise((s) => setTimeout(s, pause));
  }
  return out;
}

type ProbeResult = { group: string; keyword: string; url: string; status: number; nonLatin1: boolean };

async function probe(group: string, keyword: string, url: string): Promise<ProbeResult> {
  const status = await fetch(`${BASE}${url}`)
    .then((r) => r.status)
    .catch(() => 0);
  return { group, keyword, url, status, nonLatin1: [...keyword].some((c) => c.codePointAt(0)! > 0xff) };
}

const COMMON_SUBSTANCES = [
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
  // Hyphenated IUPAC nomenclature — checks whether slugifyCompound breaks
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
  // Common English words — checks the infinite-URL trap
  "love",
  "sunshine",
  "happy",
  "banana",
  "tree",
  "gold",
];

const ELEMENT_SYMBOLS =
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(
    " ",
  );

async function main() {
  const tasks: [string, string, string][] = [
    ...Object.keys(COMPOUND_ALIASES).map(
      (k) => ["alias", k, `/compound/${slugifyCompound(k)}`] as [string, string, string],
    ),
    ...FEATURED_COMPOUNDS.map(
      (c) => ["featured", c.name, `/compound/${slugifyCompound(c.name)}`] as [string, string, string],
    ),
    ...ELEMENT_SYMBOLS.map((s) => ["element", s, `/element/${s.toLowerCase()}`] as [string, string, string]),
    ...COMMON_SUBSTANCES.map(
      (c) => ["common", c, `/compound/${slugifyCompound(c)}`] as [string, string, string],
    ),
  ];

  const results = await runSequentially(tasks, ([g, k, u]) => probe(g, k, u));

  const serverErrors = results.filter((r) => r.status >= 500);
  const notFoundErrors = results.filter((r) => r.status === 404);
  const ok = results.filter((r) => r.status === 200);

  const byGroup = new Map<string, { ok: number; e404: number; e5xx: number; total: number }>();
  for (const r of results) {
    const entry = byGroup.get(r.group) ?? { ok: 0, e404: 0, e5xx: 0, total: 0 };
    entry.total++;
    if (r.status === 200) entry.ok++;
    else if (r.status === 404) entry.e404++;
    else if (r.status >= 500) entry.e5xx++;
    byGroup.set(r.group, entry);
  }

  const md = [
    `# Báo cáo quét URL — KAGAKU`,
    ``,
    `- Base: \`${BASE}\``,
    `- Tổng URL: **${results.length}**`,
    `- 200 OK: **${ok.length}** · 404: **${notFoundErrors.length}** · **5xx: ${serverErrors.length}**`,
    ``,
    `## Theo nhóm`,
    ``,
    `| Nhóm | 200 | 404 | 5xx | Tổng |`,
    `|---|---|---|---|---|`,
    ...[...byGroup].map(([n, e]) => `| ${n} | ${e.ok} | ${e.e404} | **${e.e5xx}** | ${e.total} |`),
    ``,
    `## 🔴 Lỗi 5xx (server sập)`,
    ``,
    `| Từ khoá | URL | Status | Có ký tự > U+00FF |`,
    `|---|---|---|---|`,
    ...serverErrors.map(
      (r) => `| \`${r.keyword}\` | \`${r.url}\` | ${r.status} | ${r.nonLatin1 ? "**CÓ**" : "không"} |`,
    ),
    ``,
    `## 404`,
    ``,
    `| Nhóm | Từ khoá | URL |`,
    `|---|---|---|`,
    ...notFoundErrors.map((r) => `| ${r.group} | \`${r.keyword}\` | \`${r.url}\` |`),
  ].join("\n");

  writeFileSync("docs/url-audit.md", md);
  console.log(`Tổng ${results.length} · 200=${ok.length} · 404=${notFoundErrors.length} · 5xx=${serverErrors.length}`);
  console.log(
    `Trong đó ${serverErrors.filter((r) => r.nonLatin1).length}/${serverErrors.length} lỗi 5xx có ký tự > U+00FF`,
  );
}

main();
