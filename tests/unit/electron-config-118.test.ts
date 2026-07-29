import { describe, it, expect } from "vitest";
import { lopVoTuCauHinh } from "@/lib/electron-config";
import fixture from "../fixtures/electron-config-118.json";

/**
 * Fixture chụp một lần từ PubChem thật (pug/periodictable/JSON, 1 request duy
 * nhất trả cả 118 nguyên tố — không cần crawl từng nguyên tố) ngày 2026-07-29.
 * Kiểm ngoại tuyến, không phụ thuộc mạng khi chạy test.
 */
type Dong = { kyHieu: string; z: number; cauHinhElectron: string };
const DU_LIEU = fixture as Dong[];

describe("lopVoTuCauHinh — quét toàn bộ 118 nguyên tố (dữ liệu PubChem thật)", () => {
  it("có đúng 118 nguyên tố trong fixture", () => {
    expect(DU_LIEU).toHaveLength(118);
  });

  const theoKyHieu = new Map(DU_LIEU.map((d) => [d.kyHieu, d]));

  it.each(DU_LIEU.map((d) => [d.kyHieu, d.z, d.cauHinhElectron] as const))(
    "%s (Z=%i): tổng electron lớp vỏ == Z",
    (_kyHieu, z, cauHinhElectron) => {
      const lop = lopVoTuCauHinh(cauHinhElectron, theoKyHieu);
      expect(lop.reduce((a, b) => a + b, 0)).toBe(z);
    },
  );
});
