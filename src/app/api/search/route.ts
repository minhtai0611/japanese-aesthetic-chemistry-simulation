import { NextResponse } from "next/server";
import { searchChemicalStructure } from "@/lib/search";

export const dynamic = "force-dynamic";

/** Number(null) === 0, not NaN — must manually guard against a missing parameter before coercing to a number. */
function numberOrUndefined(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Searches chemical structures: ?q=<SMILES/IUPAC/InChIKey substring>&min=<min
 * molar mass>&max=<max molar mass>. No valid parameter → returns empty. Only
 * queries compound_cache — never calls PubChem (there's no equivalent public
 * structure-search API to fall back to if the DB fails).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const keyword = url.searchParams.get("q") ?? undefined;

  try {
    const result = await searchChemicalStructure({
      keyword,
      minMolarMass: numberOrUndefined(url.searchParams.get("min")),
      maxMolarMass: numberOrUndefined(url.searchParams.get("max")),
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[search] Lỗi tìm cấu trúc:", e instanceof Error ? e.message : e);
    return NextResponse.json([]);
  }
}
