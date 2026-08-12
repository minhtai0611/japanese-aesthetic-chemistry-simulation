import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// pool.query touches real Postgres — mocked to test the retry/backoff/give-up
// logic of requestPubChemSlot() without a real DB, following the same
// convention as thermodynamics.test.ts mocking fetchCompound (only mock at
// the network/DB boundary — no unit test in the Vitest suite touches a real
// resource, keeping the suite green/deterministic).
vi.mock("@/db", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "@/db";
import { requestPubChemSlot } from "@/lib/rate-limiter";

const queryMock = pool.query as unknown as ReturnType<typeof vi.fn>;

describe("requestPubChemSlot", () => {
  beforeEach(() => {
    queryMock.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("has a token on the first try → returns immediately, only 1 query call", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await expect(requestPubChemSlot()).resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("out of tokens for the first few tries, then has one → waits and retries until it succeeds", async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const promise = requestPubChemSlot();
    await vi.advanceTimersByTimeAsync(3000);
    await expect(promise).resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledTimes(3);
  });

  it("always out of tokens → waits the full WAIT_TIMEOUT_MS (60s) before throwing, doesn't give up early", async () => {
    queryMock.mockResolvedValue({ rowCount: 0 });

    const promise = requestPubChemSlot();
    // Attach a catch right away to avoid an unhandled-rejection warning before the assertions below run.
    promise.catch(() => {});

    // Not yet expired (30s) — still waiting, not rejected yet.
    await vi.advanceTimersByTimeAsync(30_000);
    let settled = false;
    promise.then(
      () => (settled = true),
      () => (settled = true),
    );
    await Promise.resolve();
    expect(settled).toBe(false);
    // Already retried many times within the first 30s (not giving up after just a few).
    expect(queryMock.mock.calls.length).toBeGreaterThan(50);

    // Past the 60s deadline — now it throws.
    await vi.advanceTimersByTimeAsync(31_000);
    await expect(promise).rejects.toThrow("rate limiter: timed out waiting for a PubChem token");
  });
});
