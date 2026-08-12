import type { Metadata } from "next";
import FadeIn from "@/components/fade-in";
import Viewer3D from "@/components/compound/viewer-3d";
import { fetchCompound, fetchCompound3D } from "@/lib/pubchem";

export const metadata: Metadata = {
  title: "Đài quan sát phân tử 3D — tra cứu hợp chất PubChem",
  description:
    "Tra cứu hơn 100 triệu hợp chất trên PubChem và dựng mô hình 3D tương tác ngay trong trình duyệt: tọa độ nguyên tử, bậc liên kết, khối lượng mol, logP, TPSA, SMILES — dữ liệu đồng bộ từ PubChem, màu nguyên tử theo chuẩn CPK.",
  alternates: { canonical: "/compound" },
};

const DEFAULT_COMPOUND = "caffeine";

export default async function CompoundListPage() {
  const [initialProperties, initial3D] = await Promise.all([
    fetchCompound(DEFAULT_COMPOUND),
    fetchCompound3D(DEFAULT_COMPOUND),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
      <FadeIn className="text-center">
        <p className="chi-muc mb-4 text-shu-sang">分子観測台 — Molecular Observatory</p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
          Nhìn thấy <em className="text-shu-sang">thứ</em> mà kính hiển vi cũng phải chịu thua
        </h1>
        <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-washi-mo">
          Gõ tên một hợp chất bất kỳ — caffeine, insulin, bạch kim… PubChem mở kho tọa độ
          không gian ba chiều, và đài quan sát dựng lại từng nguyên tử, từng liên kết
          ngay trước mắt bạn, rực sáng theo quy ước màu CPK.
        </p>
      </FadeIn>

      <div className="mt-12">
        <Viewer3D
          initialName={DEFAULT_COMPOUND}
          initialProperties={initialProperties}
          initial3D={initial3D}
        />
      </div>
    </main>
  );
}
