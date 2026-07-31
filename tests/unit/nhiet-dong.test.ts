import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";

// layHopChat gọi PubChem thật — mock để test logic điều phối (bảng ghim →
// Materials Project → không có dữ liệu) mà không cần mạng thật, nhất quán
// với việc dự án này chỉ kiểm live/curl cho các hàm chạm mạng, không unit
// test chạm mạng thật trong bộ Vitest xanh/xác định.
vi.mock("@/lib/pubchem", () => ({
  layHopChat: vi.fn(),
}));

import { layHopChat } from "@/lib/pubchem";
import { layDuLieuMotChat, tinhNhietDongPhanUng } from "@/lib/hoa-hoc/nhiet-dong";

const layHopChatMock = layHopChat as unknown as ReturnType<typeof vi.fn>;

describe("layDuLieuMotChat — thứ tự ưu tiên nguồn", () => {
  beforeEach(() => {
    layHopChatMock.mockReset();
    vi.unstubAllGlobals();
    process.env.MATERIALS_PROJECT_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chất trong bảng ghim: trả ngay, KHÔNG gọi PubChem/mạng", async () => {
    const kq = await layDuLieuMotChat("H2O", phanTichCongThuc("H2O"));
    expect(kq).toEqual({ deltaH: -285.8, deltaG: -237.1, nguon: "ghim", cid: null });
    expect(layHopChatMock).not.toHaveBeenCalled();
  });

  it("nguyên tố ở trạng thái chuẩn: ΔH°f = ΔG°f = 0, từ bảng ghim", async () => {
    const kq = await layDuLieuMotChat("O2", phanTichCongThuc("O2"));
    expect(kq).toEqual({ deltaH: 0, deltaG: 0, nguon: "ghim", cid: null });
  });

  it("không có trong bảng ghim, PubChem không nhận ra công thức: trả null", async () => {
    layHopChatMock.mockResolvedValue(null);
    const kq = await layDuLieuMotChat("Xx99Zz", { Xx: 99, Zz: 1 });
    expect(kq).toBeNull();
  });

  it("không có trong bảng ghim, PubChem nhận ra, Materials Project có dữ liệu ổn định: nguồn DFT, ΔG null", async () => {
    layHopChatMock.mockResolvedValue({ cid: 14833 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ formation_energy_per_atom: -1.5 }] }),
      }),
    );
    const kq = await layDuLieuMotChat("MgO", { Mg: 1, O: 1 });
    expect(kq?.nguon).toBe("materials-project-dft");
    expect(kq?.deltaG).toBeNull();
    expect(kq?.cid).toBe(14833);
    // -1.5 eV/nguyên tử × 2 nguyên tử × 96.485 kJ/mol/eV
    expect(kq?.deltaH).toBeCloseTo(-1.5 * 2 * 96.485, 3);
  });

  it("PubChem nhận ra công thức nhưng Materials Project không có/lỗi: trả null (không suy đoán)", async () => {
    layHopChatMock.mockResolvedValue({ cid: 999 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }));
    const kq = await layDuLieuMotChat("KMnO4", phanTichCongThuc("KMnO4"));
    expect(kq).toBeNull();
  });

  it("thiếu MATERIALS_PROJECT_API_KEY: không gọi Materials Project, trả null", async () => {
    delete process.env.MATERIALS_PROJECT_API_KEY;
    layHopChatMock.mockResolvedValue({ cid: 14833 });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const kq = await layDuLieuMotChat("MgO", { Mg: 1, O: 1 });
    expect(kq).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("tinhNhietDongPhanUng — định luật Hess trên hệ số đã cân bằng", () => {
  beforeEach(() => {
    layHopChatMock.mockReset();
    vi.unstubAllGlobals();
    process.env.MATERIALS_PROJECT_API_KEY = "test-key";
  });

  it("2H2 + O2 -> 2H2O (toàn bộ từ bảng ghim): toả nhiệt, tự xảy ra ở 298K, không DFT", async () => {
    const kq = await tinhNhietDongPhanUng(
      ["H2", "O2"],
      [phanTichCongThuc("H2"), phanTichCongThuc("O2")],
      [2, 1],
      ["H2O"],
      [phanTichCongThuc("H2O")],
      [2],
    );
    expect(kq.coDuLieu).toBe(true);
    if (kq.coDuLieu) {
      expect(kq.deltaH).toBeCloseTo(-571.6, 1); // 2×(-285.8) - 0
      expect(kq.deltaH).toBeLessThan(0);
      expect(kq.deltaG).toBeCloseTo(-474.2, 1); // 2×(-237.1) - 0
      expect(kq.coNguonDFT).toBe(false);
    }
  });

  it("phản ứng có chất chỉ có dữ liệu DFT (Mg, MgO không thuộc bảng ghim): ΔH tính được (trộn ghim+DFT), ΔG null, coNguonDFT true", async () => {
    layHopChatMock.mockResolvedValue({ cid: 14833 });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ formation_energy_per_atom: -1.5 }] }),
      }),
    );
    // 2Mg + O2 -> 2MgO. O2 từ bảng ghim (ΔH°f=0); Mg và MgO đều không có
    // trong bảng ghim nên đi qua Materials Project (mock trả -1.5 eV/nguyên
    // tử cho cả hai).
    const kq = await tinhNhietDongPhanUng(
      ["Mg", "O2"],
      [phanTichCongThuc("Mg"), phanTichCongThuc("O2")],
      [2, 1],
      ["MgO"],
      [phanTichCongThuc("MgO")],
      [2],
    );
    expect(kq.coDuLieu).toBe(true);
    if (kq.coDuLieu) {
      const deltaH_Mg = -1.5 * 1 * 96.485;
      const deltaH_MgO = -1.5 * 2 * 96.485;
      expect(kq.deltaH).toBeCloseTo(2 * deltaH_MgO - (2 * deltaH_Mg + 0), 5);
      expect(kq.deltaG).toBeNull();
      expect(kq.coNguonDFT).toBe(true);
    }
  });

  it("thiếu dữ liệu của một chất bất kỳ: báo đúng tên chất thiếu, không tính", async () => {
    layHopChatMock.mockResolvedValue(null);
    const kq = await tinhNhietDongPhanUng(
      ["Al", "O2"],
      [phanTichCongThuc("Al"), phanTichCongThuc("O2")],
      [4, 3],
      ["Al2O3"],
      [phanTichCongThuc("Al2O3")],
      [2],
    );
    expect(kq.coDuLieu).toBe(false);
    if (!kq.coDuLieu) expect(kq.thieuChat).toEqual(["Al", "Al2O3"]);
  });
});
