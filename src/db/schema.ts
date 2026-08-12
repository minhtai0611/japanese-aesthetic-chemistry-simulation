/**
 * Cache layer + internal search index for compounds/elements (Postgres).
 * This is NOT a chemistry data store replacing PubChem — it only caches
 * what PubChem has already returned, plus a Vietnamese alias table for
 * better search.
 * Setup: `npm run db:push` then seed aliases via `compound_aliases`/`element_aliases`.
 * See `docs/search.md` for the DB-first/PubChem-fallback lookup flow.
 */
import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/** Compact snapshot of already-looked-up PubChem properties — avoids re-calling PUG-REST for the same CID */
export const compoundCache = pgTable(
  "compound_cache",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    queryName: text("ten_truy_van").notNull(),
    formula: text("cong_thuc"),
    molarMass: real("khoi_luong_mol"),
    iupac: text("iupac"),
    smiles: text("smiles"),
    inchikey: text("inchikey"), // from the InChIKey property — null = this substance not yet synced
    xLogP: real("xlogp"),
    has3D: boolean("co_3d"), // has a 3D conformer (record_type=3d)? — null = not yet verified
    // Real atom coordinates + bonds from record_type=3d ({ nguyenTu, lienKet },
    // matching the Atom3D/Bond3D shape in src/lib/pubchem.ts) — null when
    // has3D=false or not yet synced. Lets fetchCompound3D read from the DB before
    // hitting the NCBI network (see docs/search.md).
    conformers3d: jsonb("conformers_3d"),
    isEducational: boolean("la_giao_duc").notNull().default(false), // belongs to CHAT_GIAO_DUC
    gradeLevel: text("lop_hoc"), // "8,9,11" — NOT YET seeded, needs real curriculum data, not fabricated
    isVerified: boolean("da_xac_thuc").notNull().default(false), // a real successful PubChem call happened
    verifiedAt: timestamp("xac_thuc_luc", { withTimezone: true }),
    updatedAt: timestamp("cap_nhat_luc").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("compound_cache_cid_idx").on(t.cid),
    index("compound_cache_inchikey_idx").on(t.inchikey),
    // Trigram GIN — substring search over SMILES/IUPAC/InChIKey (ILIKE
    // '%...%'), not just exact match. pg_trgm enabled in scripts/db-enable-extensions.ts.
    index("compound_cache_smiles_trgm_idx").using("gin", sql`${t.smiles} gin_trgm_ops`),
    index("compound_cache_iupac_trgm_idx").using("gin", sql`${t.iupac} gin_trgm_ops`),
    index("compound_cache_inchikey_trgm_idx").using("gin", sql`${t.inchikey} gin_trgm_ops`),
  ],
);

/** Vietnamese/English aliases for a CID — source for full-text tsvector/GIN search */
export const compoundAliases = pgTable(
  "compound_aliases",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    alias: text("alias").notNull(),
    language: text("ngon_ngu").notNull().default("vi"), // "vi" | "en"
  },
  (t) => [
    uniqueIndex("compound_aliases_alias_cid_idx").on(t.alias, t.cid),
    // Expression index — tsvector computed on query/insert, no generated column needed.
    index("compound_aliases_tsv_idx").using("gin", sql`to_tsvector('simple', ${t.alias})`),
    // Diacritic-stripped — lets "nuoc" match "nước" without app-side normalization.
    // f_unaccent = an IMMUTABLE wrapper around unaccent() (see scripts/db-enable-extensions.ts —
    // the built-in unaccent() is STABLE, which Postgres disallows in expression indexes).
    index("compound_aliases_unaccent_tsv_idx").using(
      "gin",
      sql`to_tsvector('simple', f_unaccent(${t.alias}))`,
    ),
    // Trigram fuzzy match — tolerates minor typos ("axit sunfuaric" still returns a result).
    index("compound_aliases_trgm_idx").using("gin", sql`f_unaccent(lower(${t.alias})) gin_trgm_ops`),
  ],
);

/** Featured compounds with a permalink at /compound/[slug] — source for generateStaticParams + sitemap */
export const featuredCompounds = pgTable(
  "featured_compounds",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    slug: text("slug").notNull(),
    displayOrder: integer("thu_tu").default(0).notNull(),
  },
  (t) => [uniqueIndex("featured_compounds_cid_idx").on(t.cid), uniqueIndex("featured_compounds_slug_idx").on(t.slug)],
);

/** Vietnamese aliases for elements — supplements the static VIETNAMESE_NAMES table in src/lib/element.ts */
export const elementAliases = pgTable(
  "element_aliases",
  {
    id: serial("id").primaryKey(),
    atomicNumber: integer("so_hieu").notNull(), // atomic number Z
    alias: text("alias").notNull(),
    language: text("ngon_ngu").notNull().default("vi"),
  },
  (t) => [index("element_aliases_so_hieu_idx").on(t.atomicNumber)],
);

/** Log of queries that returned no result — source for growing Vietnamese aliases over time */
export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  keyword: text("tu_khoa").notNull(),
  hasResult: integer("co_ket_qua").notNull(), // 0 = no result, 1 = has result
  createdAt: timestamp("tao_luc").defaultNow().notNull(),
});


/**
 * Distributed token bucket for rate-limiting PubChem PUG-REST calls —
 * replaces the old in-process semaphore (removed from pubchem.ts), which
 * couldn't coordinate across different Vercel serverless instances. A
 * single row (key="pubchem_pug_rest") — see src/lib/rate-limiter.ts for the
 * refill + atomic token-consumption logic via INSERT ... ON CONFLICT DO
 * UPDATE ... WHERE.
 * `tokens` MUST be a real number — refilling is elapsed_seconds × rate, a
 * fractional amount; storing it as an integer would round away the
 * remainder on every call.
 */
export const apiTokenBucket = pgTable("api_token_bucket", {
  key: varchar("key", { length: 32 }).primaryKey(),
  tokens: real("tokens").notNull(),
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }).defaultNow().notNull(),
});
