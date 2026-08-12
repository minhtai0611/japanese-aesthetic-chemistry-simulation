/**
 * Enables the 2 Postgres extensions needed for diacritic-insensitive
 * Vietnamese search that also tolerates typos: `unaccent` (strips
 * diacritics right in SQL, no app-side normalization needed) and
 * `pg_trgm` (trigram fuzzy match, used for the GIN index in schema.ts).
 *
 * Idempotent — safe to re-run (CREATE EXTENSION IF NOT EXISTS). Run ONCE
 * before `npm run db:push` on a fresh Postgres instance, since db:push
 * (drizzle-kit) doesn't manage extensions itself.
 *
 * Usage: npx tsx scripts/db-enable-extensions.ts
 */
import "dotenv/config";
import { pool } from "../src/db";

async function main() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS unaccent");
  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");

  // Postgres's unaccent() is marked STABLE (not IMMUTABLE) because it's, in
  // theory, dependent on dictionary configuration — so it can't be used
  // directly in an expression index ("functions in index expression must be
  // marked IMMUTABLE"). Wrap it in a SQL function with a fixed 'unaccent'
  // dictionary — with a fixed dictionary, the character conversion result
  // is genuinely deterministic, so it's safe to declare IMMUTABLE. This is
  // the standard fix, officially recommended in the Postgres docs for this
  // situation.
  // LANGUAGE plpgsql (not sql): a plain sql function gets "inlined" by
  // Postgres directly into the index expression at CREATE INDEX time, and
  // that inlining step re-resolves the dictionary name/overload itself —
  // producing exactly the "does not exist" error, even though calling the
  // function directly (outside an index) works fine. plpgsql isn't inlined,
  // so IMMUTABLE is taken at face value without Postgres re-verifying it.
  await pool.query(`
    CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text AS $$
    BEGIN
      RETURN unaccent('unaccent', $1);
    END;
    $$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
  `);

  const { rows } = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname IN ('unaccent', 'pg_trgm') ORDER BY 1",
  );
  console.log("Extensions enabled:", rows.map((r) => r.extname).join(", "));
  console.log("Function f_unaccent(text) created (an IMMUTABLE wrapper around unaccent()).");
  await pool.end();
}

main();
