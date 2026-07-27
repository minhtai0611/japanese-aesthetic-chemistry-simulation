import { NextResponse } from "next/server";
import { layGoiY } from "@/lib/pubchem";
import { timHopChat } from "@/lib/tim-kiem";

export const dynamic = "force-dynamic";

export async function GET(yeu: Request) {
  const tu = new URL(yeu.url).searchParams.get("tu") ?? "";

  // 1) Postgres trước — nhanh, không phụ thuộc giới hạn tần suất PubChem.
  //    DB lỗi (mất kết nối, DATABASE_URL sai...) KHÔNG được kéo sập route —
  //    chỉ rơi về PubChem như trước khi có DB.
  let goiY: string[] = [];
  try {
    goiY = [...new Set((await timHopChat(tu)).map((r) => String(r.alias)))];
  } catch (e) {
    console.error("[tim-kiem] DB lỗi, rơi về PubChem:", e instanceof Error ? e.message : e);
  }

  // 2) Chỉ khi DB không có kết quả mới gọi PubChem.
  if (goiY.length === 0) goiY = await layGoiY(tu);

  return NextResponse.json(goiY.slice(0, 8), {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate" },
  });
}
