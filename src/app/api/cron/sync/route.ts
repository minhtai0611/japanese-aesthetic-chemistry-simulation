import { NextResponse } from "next/server";
import { syncEducationalCompound } from "@/lib/compound-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Periodic cron re-sync (see vercel.json) — refreshes compound_cache with the
 * latest PubChem data and self-heals rows that failed verification. Only
 * Vercel Cron (or whoever knows CRON_SECRET) may call this — prevents an
 * outside caller from flooding it, burning both PubChem call quota and DB
 * resources. Follows Vercel's official recommendation for protecting a Cron
 * Job route.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await syncEducationalCompound();
  const successCount = results.filter((r) => r.ok).length;

  return NextResponse.json({
    total: results.length,
    successCount,
    failed: results.filter((r) => !r.ok).map((r) => r.name),
  });
}
