import type { Metadata } from "next";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Từ khoá thiếu — quản trị",
  robots: { index: false, follow: false },
};

type MissingKeyword = Record<string, unknown> & {
  keyword: string;
  count: string; // Postgres's count(*) is a bigint — the pg driver returns it as a string
};

/** Protected by a simple token — not a public page, not linked from nav */
export default async function MissingKeywordsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const secret = process.env.QUAN_TRI_TOKEN;

  if (!secret || token !== secret) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center">
        <p className="text-washi-mo">Không có quyền truy cập.</p>
      </main>
    );
  }

  const { rows } = await db.execute<MissingKeyword>(sql`
    SELECT tu_khoa AS "keyword", count(*) AS "count"
    FROM search_logs
    WHERE co_ket_qua = 0
    GROUP BY tu_khoa
    ORDER BY count(*) DESC
    LIMIT 100
  `);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-washi">Từ khoá thiếu</h1>
      <p className="mt-2 text-sm text-washi-mo">
        Truy vấn vào /api/goi-y không ra kết quả từ compound_aliases — nguồn thật để mở rộng
        alias theo hành vi người dùng, không phải đoán.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-washi-mo">Chưa có từ khoá nào thiếu kết quả.</p>
      ) : (
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="text-left text-washi-mo">
              <th className="border-b border-washi/10 pb-2">Từ khoá</th>
              <th className="border-b border-washi/10 pb-2 text-right">Số lần</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.keyword}>
                <td className="border-b border-washi/8 py-2 text-washi">{r.keyword}</td>
                <td className="border-b border-washi/8 py-2 text-right font-mono text-washi-mo">
                  {r.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
