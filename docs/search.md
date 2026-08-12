# Compound/element search architecture

## Currently active (no DB needed)

- **Vietnamese aliases** (`src/lib/compound-alias.ts`): common names (water, salt,
  sugar, alcohol, vinegar, lye, potassium permanganate, baking soda, sulfuric acid,
  etc.) are translated to the real PubChem name before lookup (`layHopChat`,
  `layHopChat3D`) and before calling autocomplete (`layGoiY`). This is a name
  translation table, **not** chemistry data.
- **Lookup by CID**: if the keyword is entirely numeric, the system looks up
  `/compound/cid/{cid}` directly instead of `/compound/name/{ten}` — typing a
  PubChem CID (e.g. `2519` for caffeine) returns the correct result.
- Suggestions (`/api/suggestions`) merge both prefix-matched Vietnamese aliases and
  PubChem's own autocomplete, with duplicates removed.

## Wired up (real Postgres, as of PHASE 4)

The schema in `src/db/schema.ts` defines 5 tables for the internal search/cache layer:

| Table | Role |
|---|---|
| `compound_cache` | Cache of looked-up compound properties (+ `co_3d`, `da_xac_thuc`, `la_giao_duc`) |
| `compound_aliases` | Vietnamese/English compound aliases, 3 GIN indexes: raw `to_tsvector`, accent-stripped `to_tsvector(f_unaccent(...))`, `pg_trgm` fuzzy |
| `featured_compounds` | List of compounds with permalinks — **not yet used**, the static `HOP_CHAT_NOI_BAT` is still the real source |
| `element_aliases` | Vietnamese element aliases — **not yet seeded**, out of scope for PHASE 4 |
| `search_logs` | Log of queries that returned no results — see `/admin/missing-keywords` |

### The unaccent translation memory needs an IMMUTABLE wrapper function

Postgres's built-in `unaccent()` is marked **STABLE**, not **IMMUTABLE** — so it
can't be used directly in an expression index. `scripts/db-enable-extensions.ts`
creates a wrapper function `f_unaccent(text)` using `LANGUAGE plpgsql IMMUTABLE`
(plpgsql, not a plain sql function — a simple sql function gets "inlined" by
Postgres at `CREATE INDEX` time, causing inconsistent dictionary/overload
resolution errors; plpgsql avoids that). This script must be run **before**
`npm run db:push` on a fresh Postgres instance.

### How to enable this on a fresh Postgres instance

```bash
# 1. Point DATABASE_URL at a real Postgres instance (Neon or equivalent)
npx tsx scripts/db-enable-extensions.ts   # enables unaccent + pg_trgm, creates f_unaccent()
npm run db:push                           # applies the schema
npx tsx scripts/seed-compounds.ts         # seeds compound_cache + compound_aliases
                                           # from the real HOP_CHAT_NOI_BAT + ALIAS_HOP_CHAT
```

### Real lookup flow (src/lib/search.ts, /api/suggestions)

1. `timHopChat()` searches `compound_aliases`/`compound_cache` using
   `to_tsvector('simple', f_unaccent(alias)) @@ plainto_tsquery(...)` OR
   `similarity(f_unaccent(lower(alias)), ...) > 0.3` (fuzzy matching for light
   misspellings).
2. `/api/suggestions` calls step 1 first; if the DB errors (connection lost, wrong
   `DATABASE_URL`, etc.) or returns no results → falls back to `layGoiY` (PubChem
   autocomplete) as before — confirmed by pointing `DATABASE_URL` at a nonexistent
   host, the route still returns 200.
3. Writes to `search_logs` (not awaited — fire-and-forget, adding no extra
   round-trip to the response) for EVERY query, flagging `co_ket_qua`. See the
   stats at `/admin/missing-keywords?token=...` (`QUAN_TRI_TOKEN`) — grouped by
   frequency, a real source for expanding `ALIAS_HOP_CHAT` based on actual user
   behavior.
4. `/api/cron/sync` (protected by `CRON_SECRET`, scheduled in `vercel.json`) calls
   `dongBoHopChatGiaoDuc()` — the same function used by `seed-compounds.ts` — to
   refresh `compound_cache` periodically without needing to run it by hand.

### Measured latency

Server-side (`EXPLAIN ANALYZE` on ~70 rows of `compound_aliases`): **< 1ms** —
Postgres still chooses a Sequential Scan over the GIN index because the table is
too small for the index to be cheaper than a seq scan (normal, and will switch
automatically once the table grows). Latency measured from the local dev machine
to Neon (us-east-1) ranges 250ms–2000ms — **entirely due to network distance**
(confirmed since even a bare `SELECT 1` takes ~250ms), not the query itself. The
plan's p95 < 80ms target assumes a real deployment (Vercel + Neon in the same
region), and cannot be measured accurately from this dev environment.
