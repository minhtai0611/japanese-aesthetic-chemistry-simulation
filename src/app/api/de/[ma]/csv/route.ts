import { NextResponse } from "next/server";
import { xuatCSV } from "@/lib/de-thi/db";

export const dynamic = "force-dynamic";

export async function GET(yeu: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const maQuanTri = new URL(yeu.url).searchParams.get("admin") ?? "";
  if (!maQuanTri) {
    return NextResponse.json({ loi: "Thiếu mã quản trị." }, { status: 401 });
  }

  const ketQua = await xuatCSV(ma.toUpperCase(), maQuanTri);
  if (!ketQua.ok) {
    return NextResponse.json({ loi: ketQua.loi }, { status: 403 });
  }

  return new NextResponse(`﻿${ketQua.csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ket-qua-${ma.toUpperCase()}.csv"`,
    },
  });
}
