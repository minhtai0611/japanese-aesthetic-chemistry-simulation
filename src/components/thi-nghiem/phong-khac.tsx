import Link from "next/link";
import { CAC_PHONG, type SlugPhong } from "@/lib/phong-thi-nghiem";

export default function PhongKhac({ hienTai }: { hienTai: SlugPhong }) {
  const khac = CAC_PHONG.filter((p) => p.slug !== hienTai);
  return (
    <div className="mt-16 flex flex-wrap gap-2 border-t border-washi/10 pt-8">
      <span className="text-xs text-washi-mo">Phòng khác:</span>
      {khac.map((p) => (
        <Link
          key={p.slug}
          href={`/thi-nghiem/${p.slug}`}
          className="rounded-full border border-washi/12 px-4 py-1.5 text-xs text-washi-mo transition-colors hover:border-shu-sang hover:text-shu-sang"
        >
          {p.kanji} {p.nhan}
        </Link>
      ))}
    </div>
  );
}
