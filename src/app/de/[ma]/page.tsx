import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HienDan from "@/components/hien-dan";
import TrinhLamBai from "@/components/de-thi/trinh-lam-bai";
import { layBoDeTheoMa } from "@/lib/de-thi/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ma: string }> }): Promise<Metadata> {
  const { ma } = await params;
  return {
    title: `Đề ${ma.toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function TrangLamDe({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const boDe = await layBoDeTheoMa(ma.toUpperCase());
  if (!boDe) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">
          Đề {ma.toUpperCase()}
          {boDe.lop && ` · Lớp ${boDe.lop}`}
        </p>
        <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl">{boDe.ten}</h1>
        <p className="mt-4 leading-relaxed text-washi-mo">
          Trả lời bằng số (không cần đơn vị). Nộp xong sẽ thấy ngay đúng/sai và lời giải — không cần đăng nhập.
        </p>
      </HienDan>

      <div className="mt-10">
        <TrinhLamBai ma={ma.toUpperCase()} cauHoi={boDe.cauHoi} />
      </div>
    </main>
  );
}
