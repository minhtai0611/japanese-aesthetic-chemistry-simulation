import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Droplets, FlaskConical, Printer, Scale, Thermometer } from "lucide-react";
import HienDan from "@/components/hien-dan";
import { docClientId } from "@/lib/client-id";
import { laySoTayCuaToi } from "@/lib/so-tay";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

export const metadata: Metadata = {
  title: "Sổ tay thí nghiệm của tôi",
  description: "Danh sách các lượt mô phỏng đã lưu — tham số, kết quả và công thức, xem lại hoặc in báo cáo bất cứ lúc nào.",
  alternates: { canonical: "/so-tay" },
  robots: { index: false, follow: true }, // trang riêng của từng người dùng ẩn danh — không có nội dung để index
};

const ICON = {
  "pha-che": Droplets,
  "chuan-do": FlaskConical,
  "chuyen-pha": Thermometer,
  "can-bang": Scale,
} as const;

const TEN_PHONG = new Map(CAC_PHONG.map((p) => [p.slug, p.nhan]));

export default async function TrangSoTay() {
  const clientId = await docClientId();
  const danhSach = clientId ? await laySoTayCuaToi(clientId) : [];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">実験ノート — Lab Notebook</p>
        <h1 className="max-w-2xl font-display text-4xl font-black leading-tight sm:text-5xl">
          Sổ tay thí nghiệm <em className="text-shu-sang">của bạn</em>
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-washi-mo">
          Mỗi lần bấm &ldquo;Lưu vào sổ tay&rdquo; trong bốn phòng thí nghiệm, tham số và kết quả được ghi lại đây —
          không cần đăng nhập, gắn với riêng trình duyệt này. Xoá cache trình duyệt sẽ không mất dữ liệu vì mọi thứ
          đã nằm trong cơ sở dữ liệu, chỉ có cookie định danh là ở máy bạn.
        </p>
      </HienDan>

      <div className="mt-12 space-y-4">
        {danhSach.length === 0 ? (
          <div className="the-khac flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
            <BookOpen size={36} className="text-washi/20" />
            <p className="text-washi-mo">
              Chưa có gì được lưu. Vào một{" "}
              <Link href="/thi-nghiem" className="gach-dong text-kin">
                phòng thí nghiệm
              </Link>{" "}
              và bấm &ldquo;Lưu vào sổ tay&rdquo; sau khi có kết quả.
            </p>
          </div>
        ) : (
          danhSach.map((d) => {
            const Icon = ICON[d.loaiPhong as keyof typeof ICON] ?? BookOpen;
            return (
              <div key={d.id} className="the-khac flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <span className="inline-flex shrink-0 rounded-2xl border border-shu/35 bg-shu/10 p-2.5 text-shu-sang">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="chi-muc text-kin">{TEN_PHONG.get(d.loaiPhong) ?? d.loaiPhong}</p>
                    <p className="mt-1 font-medium text-washi">{d.tieuDe}</p>
                    <p className="mt-1 font-mono text-[11px] text-washi-mo">
                      {new Date(d.taoLuc).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/so-tay/${d.id}/in`}
                  className="flex items-center gap-2 rounded-full border border-washi/20 px-4 py-2 text-xs font-medium text-washi-mo transition-colors hover:border-kin hover:text-kin"
                >
                  <Printer size={13} />
                  Xem báo cáo
                </Link>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-12 text-center text-sm text-washi-mo">
        Là giáo viên?{" "}
        <Link href="/de/tao" className="gach-dong text-kin">
          Tạo đề bài tập
        </Link>{" "}
        — mã 6 ký tự cho học sinh, không cần đăng nhập cả hai phía.
      </p>
    </main>
  );
}
