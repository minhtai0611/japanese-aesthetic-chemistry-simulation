/**
 * Postgres-backed distributed token bucket for rate-limiting PubChem
 * PUG-REST calls — replaces the old in-process semaphore (removed from
 * pubchem.ts), which couldn't coordinate across different Vercel serverless
 * instances — each instance had its own in-process counter, so the actual
 * aggregate call rate could far exceed the <=5 req/s limit even though each
 * instance capped itself at 4 concurrent requests.
 *
 * Refilling + spending a token happens in ONE atomic SQL statement
 * (INSERT ... ON CONFLICT DO UPDATE ... WHERE) — safe under concurrent load
 * thanks to Postgres's own row locking: a second caller waits for the first
 * caller to commit, then re-evaluates against the updated row — there's no
 * read-then-write gap. If the WHERE condition is false (not enough tokens),
 * the UPDATE is skipped and the statement affects 0 rows — this is standard,
 * documented Postgres UPSERT behavior, not a guess.
 *
 * Imports `@/db` DYNAMICALLY (not statically at the top of the file) — same
 * reason pubchem.ts uses `await import("@/db")` for fetchConformerFromCache:
 * avoids forcing EVERY importer of this module (including pure tests that
 * never touch the DB) to have DATABASE_URL set, since `src/db/index.ts`
 * throws immediately on module load if that variable is missing.
 */
const PUBCHEM_LOCK_KEY = "pubchem_pug_rest";
const CAPACITY = 4; // max tokens (capacity) — same safety margin as the old TRAN=4
const REFILL_RATE = 4; // tokens/second (refill) — under NCBI's real <=5 req/s limit
const WAIT_INTERVAL_MS = 260; // ~1000/REFILL_RATE
/**
 * A REAL-TIME deadline, not a fixed retry count — `next build` runs
 * generateStaticParams for ~150 pages nearly simultaneously (many parallel
 * workers), creating a real burst far exceeding 4 tokens/second right at
 * startup. A fixed few-second deadline (the initial attempt) caused most
 * static build pages to give up and print errors en masse — caught for real
 * via `npm run build`, not assumed. 60 seconds is enough for the token
 * bucket to drip out enough for a large burst (60s × 4 tokens/s = 240
 * tokens) while still having a cutoff, so it doesn't wait forever if the DB
 * genuinely has a problem.
 */
const WAIT_TIMEOUT_MS = 60_000;

async function acquireToken(key: string, capacity: number, refillRate: number): Promise<boolean> {
  const { pool } = await import("@/db");
  const result = await pool.query(
    `INSERT INTO api_token_bucket (key, tokens, last_refreshed)
     VALUES ($1, $2 - 1, now())
     ON CONFLICT (key) DO UPDATE SET
       tokens = LEAST($2, api_token_bucket.tokens
         + EXTRACT(EPOCH FROM (now() - api_token_bucket.last_refreshed)) * $3) - 1,
       last_refreshed = now()
     WHERE LEAST($2, api_token_bucket.tokens
         + EXTRACT(EPOCH FROM (now() - api_token_bucket.last_refreshed)) * $3) >= 1`,
    [key, capacity, refillRate],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Requests one PubChem call slot via the distributed token bucket. Returns
 * once a token is available; throws if it waits longer than
 * `WAIT_TIMEOUT_MS` — the caller (callPugSafely in pubchem.ts) already has
 * its own error-catching/backoff/give-up loop for each network attempt, so
 * no separate error-handling mechanism is needed here.
 */
export async function requestPubChemSlot(): Promise<void> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await acquireToken(PUBCHEM_LOCK_KEY, CAPACITY, REFILL_RATE)) return;
    await new Promise((r) => setTimeout(r, WAIT_INTERVAL_MS));
  }
  throw new Error("rate limiter: timed out waiting for a PubChem token");
}
