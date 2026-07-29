import { NextResponse } from "next/server";
import { layHoacTaoClientId } from "@/lib/client-id";
import { nopBai } from "@/lib/de-thi/db";

export const dynamic = "force-dynamic";

interface TraLoiThan {
  baiTapId: number;
  traLoi: number;
}

export async function POST(yeu: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;

  let than: unknown;
  try {
    than = await yeu.json();
  } catch {
    return NextResponse.json({ loi: "Nội dung gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }
  const traLoi = (than as { traLoi?: unknown } | null)?.traLoi;
  if (!Array.isArray(traLoi)) {
    return NextResponse.json({ loi: "Thiếu danh sách câu trả lời." }, { status: 400 });
  }
  const hopLe = traLoi.every(
    (t): t is TraLoiThan =>
      typeof t === "object" && t !== null && Number.isInteger((t as TraLoiThan).baiTapId) && Number.isFinite((t as TraLoiThan).traLoi),
  );
  if (!hopLe) {
    return NextResponse.json({ loi: "Câu trả lời không hợp lệ — mỗi câu cần baiTapId và traLoi là số." }, { status: 400 });
  }

  const clientId = await layHoacTaoClientId();
  const ketQua = await nopBai(ma.toUpperCase(), clientId, traLoi as TraLoiThan[]);
  if (!ketQua.ok) {
    return NextResponse.json({ loi: ketQua.loi }, { status: 404 });
  }
  return NextResponse.json(ketQua);
}
