import { NextResponse } from "next/server";
import { layHopChat3D } from "@/lib/pubchem";

export const revalidate = 604800;

export async function GET(
  _yeu: Request,
  { params }: { params: Promise<{ ten: string }> },
) {
  const { ten } = await params;
  const moHinh = await layHopChat3D(ten);
  if (!moHinh) {
    return NextResponse.json({ loi: `PubChem không có dữ liệu 3D cho “${ten}”.` }, { status: 404 });
  }
  return NextResponse.json(moHinh, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
