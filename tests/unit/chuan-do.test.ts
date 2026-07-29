import { describe, it, expect } from "vitest";
import { pHChuanDo, theTichTuongDuong, laDiemTuongDuong } from "@/lib/hoa-hoc/chuan-do";

describe("pHChuanDo — axit mạnh / bazơ mạnh", () => {
  it("HCl 0,1M nguyên chất → pH = 1", () => {
    expect(pHChuanDo(0.1, 25, 0.1, 0)).toBeCloseTo(1.0, 2);
  });
  it("điểm tương đương → pH = 7", () => {
    expect(pHChuanDo(0.1, 25, 0.1, 25)).toBeCloseTo(7.0, 2);
  });
  it("dư bazơ nhiều → pH ≈ 12,3", () => {
    expect(pHChuanDo(0.1, 25, 0.1, 50)).toBeCloseTo(12.52, 1);
  });
  it("PROPERTY: mọi tổ hợp slider hợp lệ đều cho pH trong [0, 14]", () => {
    for (let ca = 0.02; ca <= 1; ca += 0.07)
      for (let cb = 0.02; cb <= 1; cb += 0.07)
        for (const va of [10, 25, 50]) {
          const veq = (ca * va) / cb;
          const vmax = Math.min(Math.max(veq * 2.4, va), 800);
          for (let k = 0; k <= 20; k++) {
            const p = pHChuanDo(ca, va, cb, (vmax * k) / 20);
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(14);
          }
        }
  });
});

describe("laDiemTuongDuong — cửa sổ nhãn", () => {
  it("BUG: KHÔNG được báo 'pH = 7' khi pH thực đã tụt xuống ~3", () => {
    // Ca=Cb=0,1M, Va=25mL → Veq=25mL. Cửa sổ cũ (±0,5mL) sai ở vb=24,6..24,99
    expect(laDiemTuongDuong(0.1, 25, 0.1, 24.6)).toBe(false);
    expect(pHChuanDo(0.1, 25, 0.1, 24.6)).toBeCloseTo(3.09, 1);
  });
  it("đúng điểm tương đương thì báo true", () => {
    expect(laDiemTuongDuong(0.1, 25, 0.1, 25)).toBe(true);
  });
  it("cửa sổ phải hẹp: sai lệch 1% thể tích đã là false", () => {
    expect(laDiemTuongDuong(0.1, 25, 0.1, 25 * 1.02)).toBe(false);
  });
  it("cửa sổ đủ rộng cho sai số số học: sai lệch 0,1% thể tích vẫn true", () => {
    expect(laDiemTuongDuong(0.1, 25, 0.1, 25 * 1.001)).toBe(true);
  });
});

describe("theTichTuongDuong", () => {
  it("Ca*Va = Cb*Veq", () => {
    expect(theTichTuongDuong(0.1, 25, 0.1)).toBeCloseTo(25, 5);
    expect(theTichTuongDuong(0.2, 25, 0.1)).toBeCloseTo(50, 5);
  });
});
