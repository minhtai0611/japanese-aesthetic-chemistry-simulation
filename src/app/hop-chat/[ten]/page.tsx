import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import HienDan from "@/components/hien-dan";
import TrinhPham3D from "@/components/hop-chat/trinh-pham-3d";
import { layHopChat3D, layHopChatTheoBienThe, type HopChat3D } from "@/lib/pubchem";
import { slugHoaHopChat } from "@/lib/slug";
import { canRedirect, cacBienTheTraCuu, laChatGiaoDuc, slugCanonical } from "@/lib/dinh-danh-chat";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";

interface ThuocTinhTrang {
  params: Promise<{ ten: string }>;
}

export function generateStaticParams() {
  return HOP_CHAT_NOI_BAT.map((c) => ({ ten: slugHoaHopChat(c.ten) }));
}

export async function generateMetadata({ params }: ThuocTinhTrang): Promise<Metadata> {
  const { ten } = await params;
  if (canRedirect(ten)) return {};

  const { tuKhoaDung: tenTruyVan, hopChat } = await layHopChatTheoBienThe(cacBienTheTraCuu(ten));
  if (!hopChat) return { title: "Không tìm thấy hợp chất" };

  const moTa = `${tenTruyVan} — công thức ${hopChat.congThuc ?? "—"}, khối lượng mol ${
    hopChat.khoiLuongMol ?? "—"
  } g/mol, CID ${hopChat.cid}. Mô hình 3D và thuộc tính phân tử đồng bộ từ PubChem PUG-REST.`;

  return {
    title: `${hopChat.congThuc ?? tenTruyVan} — hợp chất ${tenTruyVan}`,
    description: moTa,
    alternates: { canonical: `/hop-chat/${slugCanonical(ten)}` },
    openGraph: {
      title: `${tenTruyVan} (CID ${hopChat.cid}) · KAGAKU`,
      description: moTa,
    },
    // Chất ngoài chương trình giáo dục: không cho Google index (chặn thin content
    // vô hạn — /hop-chat/love, /hop-chat/sunshine… không phải nội dung sản phẩm định quảng bá).
    robots: laChatGiaoDuc(ten) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function TrangHopChatTheoTen({ params }: ThuocTinhTrang) {
  const { ten } = await params;

  // URL có dấu / hoa / ký tự lạ → 308 về canonical ASCII. Đây là chỗ khử lỗi
  // 500: segment ngoài Latin-1 không bao giờ tới được bước render bên dưới.
  const canon = canRedirect(ten);
  if (canon) permanentRedirect(`/hop-chat/${canon}`);

  const { tuKhoaDung: tenTruyVan, hopChat: thuocTinhBanDau } = await layHopChatTheoBienThe(
    cacBienTheTraCuu(ten),
  );

  // CHỈ notFound khi thuộc tính không có. Thiếu conformer 3D KHÔNG có nghĩa
  // "chất không tồn tại" (vd. chlorophyll a: PubChem có thuộc tính, không có 3D).
  if (!thuocTinhBanDau) notFound();

  const baChieuBanDau: HopChat3D | null = await layHopChat3D(tenTruyVan);

  const ngoaiChuongTrinh = !laChatGiaoDuc(ten);

  const lienQuan = HOP_CHAT_NOI_BAT.filter(
    (c) => c.ten.toLowerCase() !== tenTruyVan.toLowerCase(),
  ).slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8">
      <nav className="flex items-center gap-1.5 text-xs text-washi-mo" aria-label="Đường mòn">
        <Link href="/" className="gach-dong hover:text-washi">Trang chủ</Link>
        <ChevronRight size={12} />
        <Link href="/hop-chat" className="gach-dong hover:text-washi">Hợp chất 3D</Link>
        <ChevronRight size={12} />
        <span className="text-shu-sang">{tenTruyVan}</span>
      </nav>

      <HienDan className="mt-8 text-center">
        <p className="chi-muc mb-4 text-shu-sang">分子観測台 — Molecular Observatory</p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-black leading-tight capitalize sm:text-6xl">
          {thuocTinhBanDau?.congThuc ?? tenTruyVan}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-washi-mo">
          Mô hình 3D và toàn bộ thuộc tính phân tử của <strong className="text-washi">{tenTruyVan}</strong>{" "}
          — dựng trực tiếp từ tọa độ conformer thật của PubChem.
        </p>
      </HienDan>

      {ngoaiChuongTrinh && (
        <div role="note" className="the-khac mx-auto mt-8 max-w-2xl rounded-2xl border-l-4 border-kin p-5">
          <p className="text-sm text-washi-mo">
            <strong className="text-washi">Ngoài chương trình phổ thông.</strong>{" "}
            Chất này có trong CSDL PubChem nhưng không thuộc danh mục giáo dục của KAGAKU.
            Dữ liệu hiển thị vẫn lấy nguyên từ PubChem, không qua chỉnh sửa.
          </p>
        </div>
      )}

      <div className="mt-12">
        <TrinhPham3D
          tenBanDau={tenTruyVan}
          thuocTinhBanDau={thuocTinhBanDau}
          baChieuBanDau={baChieuBanDau}
        />
      </div>

      {lienQuan.length > 0 && (
        <section className="mt-16">
          <p className="chi-muc mb-4 text-shu-sang">Hợp chất liên quan</p>
          <div className="flex flex-wrap gap-2">
            {lienQuan.map((c) => (
              <Link
                key={c.ten}
                href={`/hop-chat/${slugHoaHopChat(c.ten)}`}
                className="rounded-full border border-washi/12 px-4 py-2 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
              >
                {c.nhan}
              </Link>
            ))}
          </div>
        </section>
      )}

      {thuocTinhBanDau && (
        <p className="mt-10 flex items-center gap-2 text-[11px] text-washi-mo">
          <ExternalLink size={12} className="text-kin" />
          Toàn bộ số liệu trên trang này từ{" "}
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${thuocTinhBanDau.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gach-dong text-kin"
          >
            Hợp chất CID {thuocTinhBanDau.cid} trên PubChem
          </a>
        </p>
      )}
    </main>
  );
}
