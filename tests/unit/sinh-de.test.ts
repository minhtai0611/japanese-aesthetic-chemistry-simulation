import { describe, it, expect } from "vitest";
import {
  mulberry32,
  sinhDeNongDo,
  sinhDeChuanDo,
  sinhDeChuyenPha,
  sinhDeCanBang,
  sinhDeTheoPhong,
  chamDiem,
  type DuLieuSinhDe,
} from "@/lib/de-thi/sinh-de";

describe("mulberry32 — tất định và có phân bố hợp lý", () => {
  it("cùng seed cho đúng cùng dãy số", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it("seed khác cho dãy số khác", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("mọi giá trị nằm trong [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("sinhDeNongDo — cùng seed + cùng chất ⇒ cùng đề, đáp án đúng công thức n=C×V, m=n×M", () => {
  const chat = { nhan: "NaCl", M: 58.44 };

  it("tái lập được", () => {
    expect(sinhDeNongDo(123, chat)).toEqual(sinhDeNongDo(123, chat));
  });

  it.each([1, 2, 3, 4, 5, 100, 999])("seed=%i: đáp án khớp n×M", (seed) => {
    const bt = sinhDeNongDo(seed, chat);
    const [, vStr, cStr] = bt.de.match(/pha (\d+) mL dung dịch ([\d.]+) M/) ?? [];
    expect(cStr).toBeDefined();
    const C = Number(cStr);
    const V = Number(vStr);
    expect(bt.dapAn).toBeCloseTo((C * V) / 1000 * chat.M, 4);
    expect(bt.dungSai).toBeGreaterThan(0);
  });
});

describe("sinhDeChuanDo — Ca×Va = Cb×Vb, không cần dữ liệu ngoài", () => {
  it.each([1, 2, 3, 4, 5])("seed=%i: đáp án thoả Ca×Va = Cb×dapAn", (seed) => {
    const bt = sinhDeChuanDo(seed);
    expect(bt.dapAn).toBeGreaterThan(0);
    expect(bt.dungSai).toBeGreaterThan(0);
  });
});

describe("sinhDeChuyenPha — chọn nguyên tố từ danh sách truyền vào, đổi K→°C đúng", () => {
  const ungVien = [
    { tenVi: "Sắt", kyHieu: "Fe", nongChayK: 1811 },
    { tenVi: "Vàng", kyHieu: "Au", nongChayK: 1337.33 },
  ];

  it("đáp án = K − 273,15, làm tròn 1 chữ số", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const bt = sinhDeChuyenPha(seed, ungVien);
      const khop = ungVien.some((n) => Math.abs(n.nongChayK - 273.15 - bt.dapAn) <= 0.06);
      expect(khop).toBe(true);
    }
  });

  it("ném lỗi rõ ràng khi không có ứng viên nào", () => {
    expect(() => sinhDeChuyenPha(1, [])).toThrow();
  });
});

describe("sinhDeCanBang — hệ số nguyên từ phương trình đã kiểm chứng, dung sai = 0", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])("seed=%i: hệ số nguyên dương", (seed) => {
    const bt = sinhDeCanBang(seed);
    expect(Number.isInteger(bt.dapAn)).toBe(true);
    expect(bt.dapAn).toBeGreaterThan(0);
    expect(bt.dungSai).toBe(0);
  });
});

describe("chamDiem — sai số tuyệt đối, không suy luận", () => {
  it("đúng khi trong dung sai, sai khi ngoài dung sai", () => {
    expect(chamDiem(10, 10, 0.5)).toBe(true);
    expect(chamDiem(10.4, 10, 0.5)).toBe(true);
    expect(chamDiem(10.6, 10, 0.5)).toBe(false);
    expect(chamDiem(3, 7, 0)).toBe(false); // đúng chỗ nhãn "pH=7 khi thực tế pH=3" — không được chấm đúng
  });

  it("hệ số nguyên (dungSai=0) chỉ chấp nhận khớp tuyệt đối", () => {
    expect(chamDiem(2, 2, 0)).toBe(true);
    expect(chamDiem(2.001, 2, 0)).toBe(false);
  });
});

/**
 * Cổng nghiệm thu Phase 7: "20 đề mẫu chấm đúng 20/20" — sinh 20 đề rải đều 4
 * loại phòng bằng sinhDeTheoPhong(), tự trả lời bằng CHÍNH dapAn (bốn chữ số
 * lệch nhỏ trong dung sai để mô phỏng học sinh làm tròn), xác nhận cả 20 đều
 * được chấm đúng — và một đáp án sai rõ ràng luôn bị chấm sai.
 */
describe("Cổng nghiệm thu: 20 đề mẫu chấm đúng 20/20", () => {
  const chat = { nhan: "glucose", M: 180.16 };
  const ungVien = [
    { tenVi: "Sắt", kyHieu: "Fe", nongChayK: 1811 },
    { tenVi: "Đồng", kyHieu: "Cu", nongChayK: 1357.77 },
    { tenVi: "Vàng", kyHieu: "Au", nongChayK: 1337.33 },
  ];
  const cacLoai: DuLieuSinhDe[] = [
    { loaiPhong: "pha-che", chat },
    { loaiPhong: "chuan-do" },
    { loaiPhong: "chuyen-pha", ungVien },
    { loaiPhong: "can-bang" },
  ];

  it("20/20 đề chấm đúng khi học sinh trả lời sát đáp án", () => {
    let dungHet = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const duLieu = cacLoai[seed % cacLoai.length];
      const bt = sinhDeTheoPhong(seed, duLieu);
      const traLoiHocSinh = bt.dungSai > 0 ? bt.dapAn + bt.dungSai * 0.4 : bt.dapAn;
      if (chamDiem(traLoiHocSinh, bt.dapAn, bt.dungSai)) dungHet++;
    }
    expect(dungHet).toBe(20);
  });

  it("đáp án sai rõ ràng (lệch gấp 10 lần dung sai, hoặc lệch 1 với hệ số) luôn bị chấm sai", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const duLieu = cacLoai[seed % cacLoai.length];
      const bt = sinhDeTheoPhong(seed, duLieu);
      const traLoiSai = bt.dapAn + Math.max(bt.dungSai * 10, 1);
      expect(chamDiem(traLoiSai, bt.dapAn, bt.dungSai)).toBe(false);
    }
  });
});
