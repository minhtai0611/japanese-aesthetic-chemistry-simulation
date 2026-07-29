import { NextResponse } from "next/server";
import { taoBoDe } from "@/lib/de-thi/db";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";

export const dynamic = "force-dynamic";

const CAC_SLUG_PHONG = new Set(CAC_PHONG.map((p) => p.slug));
const SO_CAU_TOI_THIEU = 3;
const SO_CAU_TOI_DA = 20;

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

  if (typeof b.ten !== "string" || b.ten.trim() === "") {
    return NextResponse.json({ loi: "Thiếu tên đề." }, { status: 400 });
  }
  if (typeof b.loaiPhong !== "string" || !CAC_SLUG_PHONG.has(b.loaiPhong as never)) {
    return NextResponse.json({ loi: "Thiếu hoặc sai loại phòng." }, { status: 400 });
  }
  const soCau = Number(b.soCau);
  if (!Number.isInteger(soCau) || soCau < SO_CAU_TOI_THIEU || soCau > SO_CAU_TOI_DA) {
    return NextResponse.json(
      { loi: `Số câu phải từ ${SO_CAU_TOI_THIEU} đến ${SO_CAU_TOI_DA}.` },
      { status: 400 },
    );
  }

  try {
    const ketQua = await taoBoDe({
      ten: b.ten.trim().slice(0, 200),
      lop: typeof b.lop === "string" && b.lop.trim() !== "" ? b.lop.trim().slice(0, 100) : undefined,
      loaiPhong: b.loaiPhong as never,
      soCau,
    });
    return NextResponse.json(ketQua, { status: 201 });
  } catch (e) {
    console.error("[de] Tạo đề lỗi:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : "Không tạo được đề — thử lại." },
      { status: 502 },
    );
  }
}
