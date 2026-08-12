import { describe, it, expect } from "vitest";
import { slugifyCompound, stripCompoundSlug } from "@/lib/slug";
import { COMPOUND_ALIASES } from "@/lib/compound-alias";

const coKyTuNgoaiLatin1 = (s: string) => [...s].some((c) => c.codePointAt(0)! > 0xff);

describe("slugifyCompound — ASCII invariant", () => {
  it("BUG 500: MỌI khoá alias phải sinh slug KHÔNG chứa ký tự > U+00FF", () => {
    const pham = Object.keys(COMPOUND_ALIASES)
      .map((k) => ({ k, slug: decodeURIComponent(slugifyCompound(k)) }))
      .filter(({ slug }) => coKyTuNgoaiLatin1(slug));
    expect(pham).toEqual([]);
  });

  it("nước → nuoc", () => expect(decodeURIComponent(slugifyCompound("nước"))).toBe("nuoc"));
  it("muối ăn → muoi-an", () => expect(decodeURIComponent(slugifyCompound("muối ăn"))).toBe("muoi-an"));
  it("đá vôi → da-voi", () => expect(decodeURIComponent(slugifyCompound("đá vôi"))).toBe("da-voi"));
  it("thuốc tím → thuoc-tim", () => expect(decodeURIComponent(slugifyCompound("thuốc tím"))).toBe("thuoc-tim"));
});

describe("boSlugHopChat — KHÔNG được phá danh pháp IUPAC", () => {
  it("BUG: gạch nối trong tên hoá học CÓ nghĩa, không được biến thành dấu cách", () => {
    // PubChem: '1,3,7-trimethylxanthine' → 200 ; '1,3,7 trimethylxanthine' → 404
    expect(stripCompoundSlug("1,3,7-trimethylxanthine")).toBe("1,3,7-trimethylxanthine");
    expect(stripCompoundSlug("cis-platin")).toBe("cis-platin");
    expect(stripCompoundSlug("n-hexane")).toBe("n-hexane");
    expect(stripCompoundSlug("D-fructose")).toBe("D-fructose");
  });
});
