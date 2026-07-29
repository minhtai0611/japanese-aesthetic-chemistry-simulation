import type { Metadata } from "next";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Từ khoá thiếu — quản trị",
  robots: { index: false, follow: false },
};

type TuKhoaThieu = Record<string, unknown> & {
  tuKhoa: string;
  soLan: string; // count(*) của Postgres là bigint — driver pg trả về string
};

/** Bảo vệ bằng token đơn giản — không phải trang công khai, không liên kết từ nav */
export default async function TrangTuKhoaThieu({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const bimat = process.env.QUAN_TRI_TOKEN;

  if (!bimat || token !== bimat) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center">
        <p className="text-washi-mo">Không có quyền truy cập.</p>
      </main>
    );
  }

  const { rows } = await db.execute<TuKhoaThieu>(sql`
    SELECT tu_khoa AS "tuKhoa", count(*) AS "soLan"
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
              <tr key={r.tuKhoa}>
                <td className="border-b border-washi/8 py-2 text-washi">{r.tuKhoa}</td>
                <td className="border-b border-washi/8 py-2 text-right font-mono text-washi-mo">
                  {r.soLan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
