import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import BangTuanHoanTuongTac from "@/components/bang-tuan-hoan/bang";
import HienDan from "@/components/hien-dan";
import { layTatCaNguyenTo } from "@/lib/pubchem";

export const metadata: Metadata = {
  title: "Bảng tuần hoàn 118 nguyên tố — dữ liệu từ PubChem",
  description:
    "Bảng tuần hoàn tương tác bằng tiếng Việt: 118 nguyên tố với khối lượng nguyên tử, điểm nóng chảy, điểm sôi, độ âm điện, cấu hình electron — toàn bộ đồng bộ từ PubChem PUG-REST, cache có kiểm soát. Lọc theo khối s/p/d/f, trạng thái vật chất, tìm kiếm tức thì.",
  alternates: { canonical: "/bang-tuan-hoan" },
  openGraph: {
    title: "Bảng tuần hoàn 118 nguyên tố — KAGAKU",
    description: "Bảng tuần hoàn tương tác tiếng Việt với dữ liệu đồng bộ từ PubChem PUG-REST.",
  },
};

export default async function TrangBangTuanHoan() {
  const nguyenTo = await layTatCaNguyenTo();

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
      <HienDan>
        <p className="chi-muc mb-4 text-shu-sang">周期表 — Periodic Table</p>
        <h1 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
          Bảng tuần hoàn <em className="text-shu-sang">sống</em>,
          <br /> không phải tấm ảnh chết
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-washi-mo">
          Từng ô dưới đây đồng bộ từ PubChem — hạ tầng khoa học công cộng của nhân loại,
          nơi cất giữ hơn một thế kỷ tri thức đo lường — và được lưu đệm có kiểm soát thay vì
          truy vấn lại mỗi lượt xem. Chạm vào một nguyên tố để mở hồ sơ đầy đủ của nó.
        </p>
      </HienDan>

      <div className="mt-10">
        {nguyenTo.length > 0 ? (
          <BangTuanHoanTuongTac nguyenTo={nguyenTo} />
        ) : (
          <div className="the-khac flex items-start gap-4 rounded-3xl p-8">
            <CloudOff className="mt-1 shrink-0 text-kin" size={24} />
            <div>
              <h2 className="font-display text-xl font-bold">PubChem tạm thởi nhàn rỗi</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-washi-mo">
                Máy chủ NCBI chưa đáp lại lễ truy vấn lần này. Hãy tải lại trang sau vài giây —
                lương tâm của chúng tôi là chỉ hiển thị dữ liệu thật, nên xin phép không
                dựng sẵn bản sao chép chế.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
