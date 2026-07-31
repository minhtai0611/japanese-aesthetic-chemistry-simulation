import { NextResponse } from "next/server";
import { timCauTrucHoaHoc } from "@/lib/tim-kiem";

export const dynamic = "force-dynamic";

/** Number(null) === 0, không phải NaN — phải chặn tay tham số vắng mặt trước khi ép số. */
function soHoacUndefined(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Tìm cấu trúc hóa học: ?q=<chuỗi con SMILES/IUPAC/InChIKey>&min=<khối lượng
 * mol tối thiểu>&max=<khối lượng mol tối đa>. Không có tham số nào hợp lệ
 * → trả rỗng. Chỉ tra compound_cache — không gọi PubChem (không có API
 * tìm cấu trúc công cộng tương đương để rơi về khi DB lỗi).
 */
export async function GET(yeu: Request) {
  const url = new URL(yeu.url);
  const tuKhoa = url.searchParams.get("q") ?? undefined;

  try {
    const ketQua = await timCauTrucHoaHoc({
      tuKhoa,
      khoiLuongToiThieu: soHoacUndefined(url.searchParams.get("min")),
      khoiLuongToiDa: soHoacUndefined(url.searchParams.get("max")),
    });
    return NextResponse.json(ketQua);
  } catch (e) {
    console.error("[tim-kiem] Lỗi tìm cấu trúc:", e instanceof Error ? e.message : e);
    return NextResponse.json([]);
  }
}
