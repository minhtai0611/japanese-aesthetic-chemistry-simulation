import Link from "next/link";
import { Database, Waypoints, ShieldCheck, Atom } from "lucide-react";
import { DIEU_HUONG, NGUON_DU_LIEU, SITE } from "@/lib/site";

export default function ChanTrang() {
  return (
    <footer className="hoa-van-song relative border-t border-washi/10 bg-sumi-nhat">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Atom className="text-shu-sang" size={26} />
              <span className="font-display text-2xl font-bold tracking-[0.16em]">
                KAGAKU <span className="text-shu-sang">科学</span>
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-washi-mo">
              {SITE.moTa}
            </p>
            <p className="mt-6 inline-flex items-start gap-2 rounded-xl border border-kin/30 bg-kin/5 px-4 py-3 text-xs leading-relaxed text-kin">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              <span>
                Cam kết minh bạch: website không tự chế số liệu. Mọi đại lượng hóa học
                đều được lấy trực tiếp từ API công cộng của{" "}
                <a
                  href={NGUON_DU_LIEU.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gach-dong font-medium text-washi"
                >
                  {NGUON_DU_LIEU.ten}
                </a>{" "}
                ({NGUON_DU_LIEU.nhaCungCap}). Hãy kiểm chứng lại trước khi dùng cho nghiên cứu chuyên sâu.
              </span>
            </p>
          </div>

          <div>
            <p className="chi-muc text-shu-sang">Khám phá</p>
            <ul className="mt-5 space-y-3">
              {DIEU_HUONG.map((muc) => (
                <li key={muc.href}>
                  <Link href={muc.href} className="gach-dong text-sm text-washi-mo hover:text-washi">
                    <span className="mr-2 text-shu-sang/80">{muc.kanji}</span>
                    {muc.nhan}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/nguyen-to/au" className="gach-dong text-sm text-washi-mo hover:text-washi">
                  <span className="mr-2 text-shu-sang/80">金</span>Nguyên tố: Vàng (Au)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="chi-muc text-shu-sang">Nguồn dữ liệu mở</p>
            <ul className="mt-5 space-y-3 text-sm text-washi-mo">
              <li className="flex items-start gap-2">
                <Database size={15} className="mt-0.5 shrink-0 text-kin" />
                <span>Bảng tuần hoàn 118 nguyên tố · tọa độ 3D · thuộc tính phân tử qua PUG-REST</span>
              </li>
              <li className="flex items-start gap-2">
                <Waypoints size={15} className="mt-0.5 shrink-0 text-kin" />
                <span>Không có kho dữ liệu hóa học riêng — đồng bộ từ NCBI, cache có kiểm soát (tối đa 7 ngày)</span>
              </li>
            </ul>
            <p className="chu-doc float-right -mt-16 hidden text-xs text-washi/20 lg:block">
              温故知新 — Ôn cố tri tân
            </p>
          </div>
        </div>

        <div className="vach-kin mt-14 opacity-60" />
        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-washi-mo sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} KAGAKU Lab — Phòng thí nghiệm hóa học số bằng tiếng Việt.</p>
          <p className="chi-muc text-[10px]">過去 の 叡智 ・ 現在 の 技 ・ 未来 の 結び</p>
        </div>
      </div>
    </footer>
  );
}
