import { NextResponse } from "next/server";
import { layHoacTaoClientId, docClientId } from "@/lib/client-id";
import { luuSoTay, laySoTayCuaToi, type DauVaoSoTay } from "@/lib/so-tay";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

export const dynamic = "force-dynamic";

const CAC_SLUG_PHONG = new Set(CAC_PHONG.map((p) => p.slug));

export async function GET() {
  const clientId = await docClientId();
  if (!clientId) return NextResponse.json([]);
  const ds = await laySoTayCuaToi(clientId);
  return NextResponse.json(ds);
}

export async function POST(yeu: Request) {
  let than: unknown;
  try {
    than = await yeu.json();
  } catch {
    return NextResponse.json({ loi: "Nội dung gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (typeof than !== "object" || than === null) {
    return NextResponse.json({ loi: "Thiếu dữ liệu." }, { status: 400 });
  }
  const b = than as Record<string, unknown>;

  if (typeof b.loaiPhong !== "string" || !CAC_SLUG_PHONG.has(b.loaiPhong as never)) {
    return NextResponse.json({ loi: "Thiếu hoặc sai loại phòng." }, { status: 400 });
  }
  if (typeof b.tieuDe !== "string" || b.tieuDe.trim() === "") {
    return NextResponse.json({ loi: "Thiếu tiêu đề." }, { status: 400 });
  }
  if (typeof b.thamSo !== "object" || b.thamSo === null) {
    return NextResponse.json({ loi: "Thiếu tham số." }, { status: 400 });
  }
  if (typeof b.ketQua !== "object" || b.ketQua === null) {
    return NextResponse.json({ loi: "Thiếu kết quả." }, { status: 400 });
  }

  const dauVao: DauVaoSoTay = {
    loaiPhong: b.loaiPhong as DauVaoSoTay["loaiPhong"],
    tieuDe: b.tieuDe.trim().slice(0, 200),
    thamSo: b.thamSo as Record<string, unknown>,
    ketQua: b.ketQua as Record<string, unknown>,
    ghiChu: typeof b.ghiChu === "string" ? b.ghiChu.slice(0, 1000) : undefined,
  };

  const clientId = await layHoacTaoClientId();
  const dong = await luuSoTay(clientId, dauVao);
  return NextResponse.json(dong, { status: 201 });
}
