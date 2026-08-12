import { NextResponse } from "next/server";
import { fetchCompound3D } from "@/lib/pubchem";

export const revalidate = 604800;

export async function GET(
  _yeu: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const moHinh = await fetchCompound3D(name);
  if (!moHinh) {
    return NextResponse.json({ loi: `PubChem không có dữ liệu 3D cho “${name}”.` }, { status: 404 });
  }
  return NextResponse.json(moHinh, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
