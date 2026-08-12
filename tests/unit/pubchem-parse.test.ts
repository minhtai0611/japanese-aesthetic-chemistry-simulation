import { describe, it, expect } from "vitest";
import { cpkColorFrom } from "@/lib/pubchem";

describe("mauCPKTu — chuẩn hoá màu CPK", () => {
  it("BUG PALADI: '6985' phải ra #006985 (xanh lam), KHÔNG phải #FF6985 (hồng)", () => {
    expect(cpkColorFrom("6985").hex).toBe("#006985");
    expect(cpkColorFrom("6985").hex).not.toBe("#FF6985");
  });

  it("mã 6 ký tự giữ nguyên", () => {
    expect(cpkColorFrom("FFFFFF").hex).toBe("#FFFFFF");
    expect(cpkColorFrom("E06633").hex).toBe("#E06633");
  });

  it("rỗng → màu mặc định và ĐÁNH DẤU nguồn là mặc định", () => {
    const r = cpkColorFrom("");
    expect(r.hex).toBe("#C8C4BC");
    expect(r.source).toBe("mac-dinh");
  });

  it("giá trị rác → mặc định, không ném lỗi", () => {
    expect(cpkColorFrom("zzz").source).toBe("mac-dinh");
    expect(cpkColorFrom("1234567").source).toBe("mac-dinh");
  });

  it("PROPERTY TEST: mọi output luôn là hex 6 ký tự hợp lệ", () => {
    const mau = ["", "6985", "FFFFFF", "abc", "0", "zzz", "12345678", undefined];
    for (const m of mau) expect(cpkColorFrom(m).hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
