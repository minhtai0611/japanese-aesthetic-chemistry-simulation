import { NextResponse } from "next/server";
import { layGoiY } from "@/lib/pubchem";

export const dynamic = "force-dynamic";

export async function GET(yeu: Request) {
  const tu = new URL(yeu.url).searchParams.get("tu") ?? "";
  const goiY = await layGoiY(tu);
  return NextResponse.json(goiY, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate" },
  });
}
