import { describe, expect, it } from "vitest";
import {
  gocLienKetDo,
  khoangCachGoc,
  khoangCachThatAngstrom,
  tinhKetQuaDoLuong,
  themLuaChonNguyenTu,
  type DiemXYZ,
} from "@/lib/hinh-hoc-do-luong";

describe("khoangCachGoc / khoangCachThatAngstrom", () => {
  it("tính đúng khoảng cách Euclid trong đơn vị khung cảnh", () => {
    const a: DiemXYZ = { x: 0, y: 0, z: 0 };
    const b: DiemXYZ = { x: 0, y: 0, z: 3 };
    expect(khoangCachGoc(a, b)).toBeCloseTo(3, 10);
  });

  it("chia lại đúng hệ số tỉ lệ để khôi phục khoảng cách thật (Å)", () => {
    const a: DiemXYZ = { x: 0, y: 0, z: 0 };
    const b: DiemXYZ = { x: 0.62, y: 0, z: 0 }; // 1 Å thật, đã co theo 0.62
    expect(khoangCachThatAngstrom(a, b, 0.62)).toBeCloseTo(1, 10);
  });
});

describe("gocLienKetDo", () => {
  it("góc vuông (90°)", () => {
    const a: DiemXYZ = { x: 1, y: 0, z: 0 };
    const b: DiemXYZ = { x: 0, y: 0, z: 0 };
    const c: DiemXYZ = { x: 0, y: 1, z: 0 };
    expect(gocLienKetDo(a, b, c)).toBeCloseTo(90, 9);
  });

  it("gần thẳng hàng (~180°)", () => {
    const a: DiemXYZ = { x: -1, y: 0, z: 0 };
    const b: DiemXYZ = { x: 0, y: 0, z: 0 };
    const c: DiemXYZ = { x: 1, y: 0, z: 0 };
    expect(gocLienKetDo(a, b, c)).toBeCloseTo(180, 9);
  });

  it("không phụ thuộc hệ số co tọa độ (góc bất biến theo tỉ lệ đều)", () => {
    const scale = 0.62;
    const a: DiemXYZ = { x: 1 * scale, y: 0, z: 0 };
    const b: DiemXYZ = { x: 0, y: 0, z: 0 };
    const c: DiemXYZ = { x: 0, y: 1 * scale, z: 0 };
    expect(gocLienKetDo(a, b, c)).toBeCloseTo(90, 9);
  });
});

describe("themLuaChonNguyenTu", () => {
  it("tích lũy tối đa 3 lựa chọn theo thứ tự bấm", () => {
    let chon = themLuaChonNguyenTu([], 5);
    expect(chon).toEqual([5]);
    chon = themLuaChonNguyenTu(chon, 2);
    expect(chon).toEqual([5, 2]);
    chon = themLuaChonNguyenTu(chon, 9);
    expect(chon).toEqual([5, 2, 9]);
  });

  it("lần bấm thứ 4 bắt đầu lại từ một lựa chọn mới", () => {
    const chon = themLuaChonNguyenTu([5, 2, 9], 7);
    expect(chon).toEqual([7]);
  });

  it("bấm lại nguyên tử đã chọn là no-op", () => {
    const chon = themLuaChonNguyenTu([5, 2], 5);
    expect(chon).toEqual([5, 2]);
  });
});

describe("tinhKetQuaDoLuong", () => {
  const nguyenTu: DiemXYZ[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0.62, y: 0, z: 0 },
    { x: 0.62, y: 0.62, z: 0 },
  ];

  it("2 lựa chọn → kết quả khoảng cách", () => {
    const kq = tinhKetQuaDoLuong(nguyenTu, [0, 1]);
    expect(kq).toEqual({ loai: "khoangCach", a: 0, b: 1, angstrom: expect.closeTo(1, 6) });
  });

  it("3 lựa chọn → kết quả góc, đỉnh là lựa chọn giữa", () => {
    const kq = tinhKetQuaDoLuong(nguyenTu, [0, 1, 2]);
    expect(kq?.loai).toBe("goc");
    if (kq?.loai === "goc") expect(kq.do).toBeCloseTo(90, 6);
  });

  it("số lựa chọn khác 2 hoặc 3 → null", () => {
    expect(tinhKetQuaDoLuong(nguyenTu, [0])).toBeNull();
    expect(tinhKetQuaDoLuong(nguyenTu, [])).toBeNull();
  });
});

describe("kiểm chứng với dữ liệu caffeine thật (CID 2519)", () => {
  // Tọa độ 10 nguyên tử đầu của caffeine, lấy TRỰC TIẾP từ PubChem PUG-REST
  // (record_type=3d, CID 2519) ngày 2026-08-02, đã trừ tâm khối và nhân hệ số
  // co TY_LE_TOA_DO_3D=0.62 giống hệt pipeline thật của layHopChat3D — không
  // gọi mạng trong test này (đúng quy ước cô lập test hiện có, xem
  // tests/unit/nhiet-dong.test.ts).
  const caffeine: DiemXYZ[] = [
    { x: 0.252, y: 1.5659, z: 0.0002 }, // 0: O
    { x: -1.9782, y: -0.3018, z: -0.0004 }, // 1: O
    { x: -0.64, y: -0.8405, z: -0.0002 }, // 2: N
    { x: 1.3359, y: 0.0608, z: -0.0004 }, // 3: N
    { x: -0.8749, y: 0.6426, z: -0.0002 }, // 4: N
    { x: 0.8359, y: -1.2278, z: -0.0001 }, // 5: N
    { x: 0.4925, y: 0.1339, z: -0.0007 }, // 6: C
    { x: 0.2022, y: -0.6632, z: -0.0004 }, // 7: C — liên kết đơn N(2)-C(7) có thật trong PC_Compounds.bonds
    { x: -0.0204, y: 0.8549, z: -0.0006 }, // 8: C
    { x: -1.2212, y: -0.1815, z: -0.0004 }, // 9: C
  ];

  it("khoảng cách liên kết đơn N–C của vòng imidazole nằm trong dải hợp lý (1.30–1.50 Å)", () => {
    // Bond thật trong PC_Compounds.bonds (PubChem, 1-indexed): aid1=3,aid2=8,order=1
    // → chỉ số 0-based: nguyên tử 2 (N) – nguyên tử 7 (C).
    const khoangCach = khoangCachThatAngstrom(caffeine[2], caffeine[7]);
    expect(khoangCach).toBeGreaterThan(1.3);
    expect(khoangCach).toBeLessThan(1.5);
  });
});
