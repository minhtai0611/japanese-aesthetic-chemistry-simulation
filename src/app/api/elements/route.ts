import { NextResponse } from "next/server";
import { fetchAllElements } from "@/lib/pubchem";

export const revalidate = 604800; // 7 days

export async function GET() {
  const elements = await fetchAllElements();
  return NextResponse.json(elements, {
    headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate" },
  });
}
