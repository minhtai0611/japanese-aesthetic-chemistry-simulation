import { NextResponse } from "next/server";
import { layBoDeTheoMa } from "@/lib/de-thi/db";

export const dynamic = "force-dynamic";

export async function GET(_yeu: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const boDe = await layBoDeTheoMa(ma.toUpperCase());
  if (!boDe) {
    return NextResponse.json({ loi: `Không tìm thấy đề "${ma}".` }, { status: 404 });
  }
  return NextResponse.json(boDe);
}
