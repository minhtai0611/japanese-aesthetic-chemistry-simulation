import { NextResponse } from "next/server";
import { dongBoHopChatGiaoDuc } from "@/lib/dong-bo-hop-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron re-sync định kỳ (xem vercel.json) — làm mới compound_cache theo dữ
 * liệu PubChem mới nhất và tự phục hồi các dòng lỡ chưa xác thực. Chỉ Vercel
 * Cron (hoặc ai biết CRON_SECRET) được gọi — tránh ai đó bên ngoài gọi tràn,
 * tốn cả lượt gọi PubChem lẫn tài nguyên DB. Theo đúng khuyến nghị chính thức
 * của Vercel cho việc bảo vệ Cron Job route.
 */
export async function GET(yeu: Request) {
  const bimat = process.env.CRON_SECRET;
  if (bimat && yeu.headers.get("authorization") !== `Bearer ${bimat}`) {
    return NextResponse.json({ loi: "unauthorized" }, { status: 401 });
  }

  const ketQua = await dongBoHopChatGiaoDuc();
  const thanhCong = ketQua.filter((r) => r.ok).length;

  return NextResponse.json({
    tongSo: ketQua.length,
    thanhCong,
    khongXacThucDuoc: ketQua.filter((r) => !r.ok).map((r) => r.ten),
  });
}
