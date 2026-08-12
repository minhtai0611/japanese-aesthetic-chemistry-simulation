import { describe, it, expect } from "vitest";
import {
  stripVietnameseDiacritics,
  canonicalSlug,
  canRedirect,
  lookupVariants,
  resolveAlias,
  isEducationalSubstance,
  EDUCATIONAL_SUBSTANCES,
} from "@/lib/substance-identification";

describe("boDauTiengViet", () => {
  it("bỏ dấu thanh điệu và nguyên âm mở rộng, giữ đ→d", () => {
    expect(stripVietnameseDiacritics("đường")).toBe("duong");
    expect(stripVietnameseDiacritics("Đá Vôi")).toBe("Da Voi");
    expect(stripVietnameseDiacritics("nước")).toBe("nuoc");
  });
  it("chuỗi ASCII thuần không đổi", () => {
    expect(stripVietnameseDiacritics("caffeine")).toBe("caffeine");
  });
});

describe("canonicalSlug", () => {
  it("BUG 500 gốc: mọi output đều là ASCII an toàn cho dynamic segment (không ký tự > U+00FF)", () => {
    for (const input of ["nước", "muối ăn", "đá vôi", "thuốc tím", "Xesi", "Đồng"]) {
      const slug = canonicalSlug(input);
      expect([...slug].every((c) => c.codePointAt(0)! <= 0xff)).toBe(true);
    }
  });

  it("giữ nguyên gạch nối/dấu phẩy có nghĩa hoá học (IUPAC)", () => {
    expect(canonicalSlug("1,3,7-trimethylxanthine")).toBe("1,3,7-trimethylxanthine");
    expect(canonicalSlug("cis-platin")).toBe("cis-platin");
  });

  it("khoảng trắng → gạch nối, gộp gạch nối liên tiếp, cắt gạch nối đầu/cuối", () => {
    expect(canonicalSlug("muối ăn")).toBe("muoi-an");
    expect(canonicalSlug("  đá   vôi  ")).toBe("da-voi");
  });

  it("là hàm idempotent: canonical hoá lần hai không đổi kết quả", () => {
    for (const input of ["nước", "1,3,7-trimethylxanthine", "  Đá Vôi "]) {
      const once = canonicalSlug(input);
      expect(canonicalSlug(once)).toBe(once);
    }
  });
});

describe("canRedirect", () => {
  it("slug đã canonical → null (không redirect)", () => {
    expect(canRedirect("nuoc")).toBeNull();
    expect(canRedirect("1,3,7-trimethylxanthine")).toBeNull();
    expect(canRedirect("caffeine")).toBeNull();
  });
  it("slug có dấu/hoa → trả về bản canonical để redirect", () => {
    expect(canRedirect("nước")).toBe("nuoc");
    expect(canRedirect("Caffeine")).toBe("caffeine");
  });
});

describe("cacBienTheTraCuu", () => {
  it("biến thể đầu tiên luôn giữ nguyên văn (không phá gạch nối IUPAC)", () => {
    expect(lookupVariants("1,3,7-trimethylxanthine")[0]).toBe("1,3,7-trimethylxanthine");
    expect(lookupVariants("cis-platin")[0]).toBe("cis-platin");
  });

  it("BUG P0-2: slug alias tiếng Việt phải tìm ra được tên PubChem thật qua ít nhất một biến thể", () => {
    expect(lookupVariants("nuoc")).toContain("water");
    expect(lookupVariants("da-voi")).toContain("calcium carbonate");
    expect(lookupVariants("thuoc-tim")).toContain("potassium permanganate");
  });
});

describe("traAlias", () => {
  it("'nuoc', 'nước', 'NƯỚC' đều khớp cùng một bản dịch", () => {
    expect(resolveAlias("nuoc")).toBe("water");
    expect(resolveAlias("nước")).toBe("water");
    expect(resolveAlias("NƯỚC")).toBe("water");
  });
  it("không khớp alias nào → null", () => expect(resolveAlias("caffeine")).toBeNull());
});

describe("EDUCATIONAL_SUBSTANCES / isEducationalSubstance", () => {
  it("suy ra từ dữ liệu thật trong repo, không rỗng", () => {
    expect(EDUCATIONAL_SUBSTANCES.length).toBeGreaterThan(0);
  });

  it("BUG P0-5: chất nổi bật + alias tiếng Việt thuộc whitelist giáo dục", () => {
    expect(isEducationalSubstance("caffeine")).toBe(true);
    expect(isEducationalSubstance("nuoc")).toBe(true);
    expect(isEducationalSubstance("nước")).toBe(true);
  });

  it("BUG P0-5: tên lóng chất kích thích KHÔNG thuộc whitelist giáo dục", () => {
    expect(isEducationalSubstance("love")).toBe(false);
    expect(isEducationalSubstance("sunshine")).toBe(false);
  });
});
