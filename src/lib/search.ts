/**
 * Finds a compound by its Vietnamese/English name, diacritic-insensitive and
 * typo-tolerant — pure SQL (to_tsvector for word matching, pg_trgm similarity
 * for fuzzy matching). NO AI/embeddings — a hard requirement of this project.
 *
 * DB-first/PubChem-second: this is the FAST layer, not subject to PubChem's
 * rate limit. If the DB errors out or returns nothing, the caller (the
 * /api/suggestions route) falls back to getSuggestions (PubChem autocomplete)
 * on its own — see docs/search.md.
 */
import { db } from "@/db";
import { searchLogs } from "@/db/schema";
import { sql } from "drizzle-orm";

export type SearchResult = Record<string, unknown> & {
  cid: number;
  queryName: string;
  formula: string | null;
  molarMass: number | null;
  alias: string;
  diem: number;
};

export async function searchCompound(q: string, limit = 8): Promise<SearchResult[]> {
  const keyword = q.trim();
  if (keyword.length < 2) return [];

  const { rows } = await db.execute<SearchResult>(sql`
    SELECT c.cid, c.ten_truy_van AS "queryName", c.cong_thuc AS "formula",
           c.khoi_luong_mol AS "molarMass", a.alias,
           GREATEST(
             ts_rank(to_tsvector('simple', f_unaccent(a.alias)),
                     plainto_tsquery('simple', f_unaccent(${keyword}))),
             similarity(f_unaccent(lower(a.alias)), f_unaccent(lower(${keyword})))
           ) AS diem
    FROM compound_aliases a
    JOIN compound_cache c ON c.cid = a.cid
    WHERE to_tsvector('simple', f_unaccent(a.alias)) @@ plainto_tsquery('simple', f_unaccent(${keyword}))
       OR similarity(f_unaccent(lower(a.alias)), f_unaccent(lower(${keyword}))) > 0.3
    ORDER BY diem DESC
    LIMIT ${limit}
  `);

  // Logs the query — the source for growing aliases based on users' REAL
  // BEHAVIOR, instead of guessing. NOT awaited: this is a side effect, not
  // part of the search result — waiting on it would only cost the user an
  // extra DB round-trip for zero benefit to them. A logging failure must NOT
  // break or slow down the search result.
  db.insert(searchLogs)
    .values({ keyword, hasResult: rows.length > 0 ? 1 : 0 })
    .catch((e) => console.error("[search] ghi search_logs lỗi:", e instanceof Error ? e.message : e));

  return rows;
}

export type StructureSearchResult = {
  cid: number;
  queryName: string;
  formula: string | null;
  molarMass: number | null;
  smiles: string | null;
  iupac: string | null;
  inchikey: string | null;
};

/**
 * Finds a compound by structure: SMILES/IUPAC/InChIKey substring (ILIKE,
 * using the trigram GIN index on compound_cache) and/or a molar-mass range.
 * Only searches compound_cache — substances ALREADY really synced from
 * PubChem via compound-sync.ts; never guesses/interpolates a mass for a
 * substance that isn't there yet. No parameters at all → returns empty
 * (avoids an unconditional SELECT *).
 */
export async function searchChemicalStructure(params: {
  keyword?: string;
  minMolarMass?: number;
  maxMolarMass?: number;
  limit?: number;
}): Promise<StructureSearchResult[]> {
  const { keyword, minMolarMass, maxMolarMass, limit = 20 } = params;
  const trimmed = keyword?.trim();

  const conditions = [];
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    conditions.push(sql`(c.smiles ILIKE ${pattern} OR c.iupac ILIKE ${pattern} OR c.inchikey ILIKE ${pattern})`);
  }
  if (minMolarMass != null) conditions.push(sql`c.khoi_luong_mol >= ${minMolarMass}`);
  if (maxMolarMass != null) conditions.push(sql`c.khoi_luong_mol <= ${maxMolarMass}`);
  if (conditions.length === 0) return [];

  const { rows } = await db.execute<StructureSearchResult>(sql`
    SELECT c.cid, c.ten_truy_van AS "queryName", c.cong_thuc AS "formula",
           c.khoi_luong_mol AS "molarMass", c.smiles, c.iupac, c.inchikey
    FROM compound_cache c
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY c.khoi_luong_mol ASC NULLS LAST
    LIMIT ${limit}
  `);
  return rows;
}
