import { describe, expect, it } from "vitest";
import { deltaHVapKJMol, duongRanhGioiLongKhi, nhietDoSoiTheoApSuat } from "@/lib/hoa-hoc/gian-do-pha";

describe("deltaHVapKJMol", () => {
  it("trả đúng giá trị đã ghim (CRC/Lange's, đối chiếu Wikipedia data page) cho vài nguyên tố", () => {
    expect(deltaHVapKJMol(1)).toBeCloseTo(0.904, 6); // H (H2)
    expect(deltaHVapKJMol(26)).toBeCloseTo(340, 6); // Fe
    expect(deltaHVapKJMol(11)).toBeCloseTo(97.42, 6); // Na
  });

  it("trả null cho nguyên tố KHÔNG có trong bảng nguồn — không suy đoán", () => {
    expect(deltaHVapKJMol(43)).toBeNull(); // Tc
    expect(deltaHVapKJMol(118)).toBeNull(); // Og
  });
});

describe("nhietDoSoiTheoApSuat — kiểm chứng bằng Nước (H2O)", () => {
  // ΔH_vap nước tại điểm sôi thường = 40.65 kJ/mol, T1 = 373.15 K (100 °C, 1 atm)
  // — giá trị chuẩn NIST/CRC, đã đối chiếu trong phiên nghiên cứu trước khi viết test.
  const DELTA_H_VAP_NUOC = 40.65;
  const T_SOI_1ATM = 373.15;

  it("ở 1 atm cho đúng 373.15 K (điểm chuẩn, không đổi)", () => {
    expect(nhietDoSoiTheoApSuat(DELTA_H_VAP_NUOC, T_SOI_1ATM, 1)).toBeCloseTo(373.15, 6);
  });

  it("ở 0.5 atm cho nhiệt độ sôi THẤP hơn, khớp giá trị đo thật (~354.4 K / 81.3 °C)", () => {
    const t = nhietDoSoiTheoApSuat(DELTA_H_VAP_NUOC, T_SOI_1ATM, 0.5);
    expect(t).toBeLessThan(373.15);
    expect(t).toBeCloseTo(354.4, 0); // sai số dưới 0.5 K so với số đo thật
  });

  it("áp suất cao hơn 1 atm cho nhiệt độ sôi CAO hơn", () => {
    const t = nhietDoSoiTheoApSuat(DELTA_H_VAP_NUOC, T_SOI_1ATM, 2);
    expect(t).toBeGreaterThan(373.15);
  });
});

describe("duongRanhGioiLongKhi", () => {
  it("sinh đúng soDiem+1 điểm, đơn điệu theo áp suất, đúng 2 đầu mút", () => {
    const duong = duongRanhGioiLongKhi(40.65, 373.15, 0.01, 100, 60);
    expect(duong).toHaveLength(61);
    expect(duong[0].apSuatAtm).toBeCloseTo(0.01, 6);
    expect(duong[duong.length - 1].apSuatAtm).toBeCloseTo(100, 6);
    for (let i = 1; i < duong.length; i++) {
      expect(duong[i].apSuatAtm).toBeGreaterThan(duong[i - 1].apSuatAtm);
      expect(duong[i].nhietDoK).toBeGreaterThan(duong[i - 1].nhietDoK);
    }
  });
});
