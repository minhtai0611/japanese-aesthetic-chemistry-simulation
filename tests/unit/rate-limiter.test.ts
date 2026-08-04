import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// pool.query chạm Postgres thật — mock để test logic retry/backoff/bỏ cuộc
// của xinLuotPubChem() mà không cần DB thật, cùng quy ước với cách
// nhiet-dong.test.ts mock layHopChat (chỉ mock ở biên mạng/DB, không unit
// test chạm tài nguyên thật trong bộ Vitest xanh/xác định).
vi.mock("@/db", () => ({
  pool: { query: vi.fn() },
}));

import { pool } from "@/db";
import { xinLuotPubChem } from "@/lib/rate-limiter";

const queryMock = pool.query as unknown as ReturnType<typeof vi.fn>;

describe("xinLuotPubChem", () => {
  beforeEach(() => {
    queryMock.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("có token ngay lần thử đầu → trả về ngay, chỉ 1 lần gọi query", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await expect(xinLuotPubChem()).resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("hết token vài lần đầu rồi có → chờ rồi thử lại cho đến khi thành công", async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const promise = xinLuotPubChem();
    await vi.advanceTimersByTimeAsync(3000);
    await expect(promise).resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledTimes(3);
  });

  it("luôn hết token → chờ đủ HAN_CHO_MS (60s) rồi mới ném lỗi, không bỏ cuộc sớm", async () => {
    queryMock.mockResolvedValue({ rowCount: 0 });

    const promise = xinLuotPubChem();
    // Gắn catch ngay để tránh unhandled-rejection cảnh báo trước khi assert bên dưới chạy.
    promise.catch(() => {});

    // Chưa hết hạn (30s) — vẫn đang chờ, chưa reject.
    await vi.advanceTimersByTimeAsync(30_000);
    let daXongChua = false;
    promise.then(
      () => (daXongChua = true),
      () => (daXongChua = true),
    );
    await Promise.resolve();
    expect(daXongChua).toBe(false);
    // Vẫn đã thử lại nhiều lần trong 30s đầu (không phải bỏ cuộc chỉ sau vài lần).
    expect(queryMock.mock.calls.length).toBeGreaterThan(50);

    // Qua khỏi hạn 60s — giờ mới ném lỗi.
    await vi.advanceTimersByTimeAsync(31_000);
    await expect(promise).rejects.toThrow("rate limiter: hết lượt chờ token PubChem");
  });
});
