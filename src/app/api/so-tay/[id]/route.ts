import { NextResponse } from "next/server";
import { docClientId } from "@/lib/client-id";
import { laySoTayTheoId } from "@/lib/so-tay";

export const dynamic = "force-dynamic";

export async function GET(_yeu: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const soId = Number(id);
  if (!Number.isInteger(soId)) {
    return NextResponse.json({ loi: "ID không hợp lệ." }, { status: 400 });
  }

  const clientId = await docClientId();
  if (!clientId) return NextResponse.json({ loi: "Không tìm thấy." }, { status: 404 });

  const dong = await laySoTayTheoId(soId, clientId);
  if (!dong) return NextResponse.json({ loi: "Không tìm thấy." }, { status: 404 });

  return NextResponse.json(dong);
}
