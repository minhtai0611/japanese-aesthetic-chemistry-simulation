import { NextResponse } from "next/server";
import { layHopChat } from "@/lib/pubchem";

export const revalidate = 604800;

export async function GET(
  _yeu: Request,
  { params }: { params: Promise<{ ten: string }> },
) {
  const { ten } = await params;
  const hopChat = await layHopChat(ten);
  if (!hopChat) {
    return NextResponse.json({ loi: `Không tìm thấy “${ten}” trên PubChem.` }, { status: 404 });
  }
  return NextResponse.json(hopChat, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
