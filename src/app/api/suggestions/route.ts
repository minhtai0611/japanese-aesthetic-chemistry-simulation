import { NextResponse } from "next/server";
import { getSuggestions } from "@/lib/pubchem";
import { searchCompound } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q") ?? "";

  // 1) Postgres first — fast, not subject to PubChem's rate limit.
  //    A DB error (dropped connection, wrong DATABASE_URL...) must NOT take
  //    down the route — just fall back to PubChem as before there was a DB.
  let suggestions: string[] = [];
  try {
    suggestions = [...new Set((await searchCompound(query)).map((r) => String(r.alias)))];
  } catch (e) {
    console.error("[search] DB error, falling back to PubChem:", e instanceof Error ? e.message : e);
  }

  // 2) Only call PubChem when the DB returned no results.
  if (suggestions.length === 0) suggestions = await getSuggestions(query);

  return NextResponse.json(suggestions.slice(0, 8), {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate" },
  });
}
