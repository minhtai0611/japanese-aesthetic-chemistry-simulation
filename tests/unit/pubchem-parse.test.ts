import { describe, it, expect } from "vitest";
import { mauCPKTu } from "@/lib/pubchem";

describe("mauCPKTu — chuẩn hoá màu CPK", () => {
  it("BUG PALADI: '6985' phải ra #006985 (xanh lam), KHÔNG phải #FF6985 (hồng)", () => {
    expect(mauCPKTu("6985").hex).toBe("#006985");
    expect(mauCPKTu("6985").hex).not.toBe("#FF6985");
  });

  it("mã 6 ký tự giữ nguyên", () => {
    expect(mauCPKTu("FFFFFF").hex).toBe("#FFFFFF");
    expect(mauCPKTu("E06633").hex).toBe("#E06633");
  });

  it("rỗng → màu mặc định và ĐÁNH DẤU nguồn là mặc định", () => {
    const r = mauCPKTu("");
    expect(r.hex).toBe("#C8C4BC");
    expect(r.nguon).toBe("mac-dinh");
  });

  it("giá trị rác → mặc định, không ném lỗi", () => {
    expect(mauCPKTu("zzz").nguon).toBe("mac-dinh");
    expect(mauCPKTu("1234567").nguon).toBe("mac-dinh");
  });

  it("PROPERTY TEST: mọi output luôn là hex 6 ký tự hợp lệ", () => {
    const mau = ["", "6985", "FFFFFF", "abc", "0", "zzz", "12345678", undefined];
    for (const m of mau) expect(mauCPKTu(m).hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
