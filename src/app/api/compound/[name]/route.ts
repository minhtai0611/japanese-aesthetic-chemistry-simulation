import { NextResponse } from "next/server";
import { fetchCompound } from "@/lib/pubchem";

export const revalidate = 604800;

export async function GET(
  _yeu: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const compound = await fetchCompound(name);
  if (!compound) {
    return NextResponse.json({ loi: `Không tìm thấy “${name}” trên PubChem.` }, { status: 404 });
  }
  return NextResponse.json(compound, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
