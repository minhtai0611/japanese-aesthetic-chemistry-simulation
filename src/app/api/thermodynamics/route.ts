import { NextResponse } from "next/server";
import { calculateReactionThermodynamics } from "@/lib/chemistry/thermodynamics";
import { parseFormula } from "@/lib/chemistry/formula-parser";

export const dynamic = "force-dynamic";

interface RequestBody {
  leftNames: string[];
  leftCoefficients: number[];
  rightNames: string[];
  rightCoefficients: number[];
}

/**
 * Server-only: looks up thermodynamics (PubChem + Materials Project, see
 * thermodynamics.ts) for an ALREADY-BALANCED equation. Must be its own
 * route — must NOT be called directly from a "use client" component, since
 * thermodynamics.ts (via pubchem.ts) touches `pg`/Node-only modules, and
 * MATERIALS_PROJECT_API_KEY must NOT leak into the client bundle.
 */
export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }

  const { leftNames, leftCoefficients, rightNames, rightCoefficients } = body;
  if (
    !Array.isArray(leftNames) || !Array.isArray(leftCoefficients) || !Array.isArray(rightNames) || !Array.isArray(rightCoefficients) ||
    leftNames.length !== leftCoefficients.length || rightNames.length !== rightCoefficients.length
  ) {
    return NextResponse.json({ error: "Thiếu hoặc sai hình dạng leftNames/leftCoefficients/rightNames/rightCoefficients." }, { status: 400 });
  }

  try {
    const leftTables = leftNames.map(parseFormula);
    const rightTables = rightNames.map(parseFormula);
    const result = await calculateReactionThermodynamics(leftNames, leftTables, leftCoefficients, rightNames, rightTables, rightCoefficients);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[thermodynamics] Thermodynamics calculation error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ hasData: false, missingSubstances: [...leftNames, ...rightNames] });
  }
}
