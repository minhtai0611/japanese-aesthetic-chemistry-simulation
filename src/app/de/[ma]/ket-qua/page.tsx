import type { Metadata } from "next";
import { Download, Lock } from "lucide-react";
import HienDan from "@/components/hien-dan";
import { layKetQuaBoDe } from "@/lib/de-thi/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kết quả đề — chế độ giáo viên",
  robots: { index: false, follow: false },
};

function FormMaQuanTri({ ma, loi }: { ma: string; loi?: string }) {
  return (
    <div className="the-khac mx-auto mt-10 max-w-md rounded-3xl p-7 text-center">
      <Lock size={28} className="mx-auto mb-4 text-kin" />
      <p className="text-sm text-washi-mo">Nhập mã quản trị nhận được lúc tạo đề {ma} để xem kết quả.</p>
      {loi && <p className="mt-3 text-sm text-shu-sang">{loi}</p>}
      <form method="GET" className="mt-5 flex gap-2">
        <input
          type="text"
          name="admin"
          placeholder="Mã quản trị"
          required
          className="the-khac flex-1 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-washi-mo/50"
          aria-label="Mã quản trị"
        />
        <button
          type="submit"
          className="nut-chu shrink-0 rounded-full bg-shu px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-95"
        >
          Xem
        </button>
      </form>
    </div>
  );
}

export default async function TrangKetQuaDe({
  params,
  searchParams,
}: {
  params: Promise<{ ma: string }>;
  searchParams: Promise<{ admin?: string }>;
}) {
  const { ma } = await params;
  const { admin } = await searchParams;
  const maChuan = ma.toUpperCase();

  if (!admin) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8">
        <FormMaQuanTri ma={maChuan} />
      </main>
    );
  }

  const ketQua = await layKetQuaBoDe(maChuan, admin);
  if (!ketQua.ok) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8">
        <FormMaQuanTri ma={maChuan} loi={ketQua.loi} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="chi-muc mb-3 text-shu-sang">
              Đề {maChuan}
              {ketQua.lop && ` · Lớp ${ketQua.lop}`}
            </p>
            <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl">{ketQua.ten}</h1>
            <p className="mt-3 text-sm text-washi-mo">{ketQua.hocSinh.length} học sinh đã nộp bài</p>
          </div>
          <a
            href={`/api/de/${maChuan}/csv?admin=${encodeURIComponent(admin)}`}
            className="flex items-center gap-2 rounded-full border border-washi/20 px-4 py-2 text-xs font-medium text-washi-mo transition-colors hover:border-kin hover:text-kin"
          >
            <Download size={14} />
            Xuất CSV
          </a>
        </div>
      </HienDan>

      <div className="mt-10 overflow-x-auto">
        {ketQua.hocSinh.length === 0 ? (
          <p className="text-washi-mo">Chưa có học sinh nào nộp bài.</p>
        ) : (
          <table className="w-full min-w-[600px] text-sm">
            <caption className="sr-only">Kết quả từng học sinh cho đề {maChuan}</caption>
            <thead>
              <tr className="border-b border-washi/10 text-left text-[10px] uppercase tracking-wider text-washi-mo">
                <th scope="col" className="py-2 pr-3 font-normal">
                  Học sinh (client_id)
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  Điểm
                </th>
                {ketQua.hocSinh[0].chiTiet.map((c) => (
                  <th key={c.thuTu} scope="col" className="py-2 pr-3 text-center font-normal">
                    Câu {c.thuTu}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ketQua.hocSinh.map((h) => (
                <tr key={h.clientId} className="border-b border-washi/5 font-mono text-xs">
                  <td className="py-2 pr-3" title={h.clientId}>
                    {h.clientId.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-3 font-semibold text-shu-sang">
                    {h.soDung}/{h.soCau}
                  </td>
                  {h.chiTiet.map((c) => (
                    <td key={c.thuTu} className="py-2 pr-3 text-center">
                      {c.traLoi === null ? (
                        <span className="text-washi-mo/40">—</span>
                      ) : c.dung ? (
                        <span className="text-tokiwa">✓</span>
                      ) : (
                        <span className="text-shu-sang">✗</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
