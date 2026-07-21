import { NextResponse } from "next/server";
import { layTatCaNguyenTo } from "@/lib/pubchem";

export const revalidate = 604800; // 7 ngày

export async function GET() {
  const nguyenTo = await layTatCaNguyenTo();
  return NextResponse.json(nguyenTo, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
