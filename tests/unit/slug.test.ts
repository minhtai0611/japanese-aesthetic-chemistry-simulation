import { describe, it, expect } from "vitest";
import { slugHoaHopChat, boSlugHopChat } from "@/lib/slug";
import { ALIAS_HOP_CHAT } from "@/lib/alias-hop-chat";

const coKyTuNgoaiLatin1 = (s: string) => [...s].some((c) => c.codePointAt(0)! > 0xff);

// 🔴 Cả nhóm dưới đây FAIL ở PHA 1 — đúng ý đồ. Chúng là lưới an toàn để PHA 2
// chứng minh đã sửa thật (bỏ `.fails` khi slugHoaHopChat/boSlugHopChat đổi sang
// nền tảng dinh-danh-chat.ts trong PHA 2).
describe("slugHoaHopChat — bất biến ASCII (PHA 2 sẽ sửa)", () => {
  it.fails("BUG 500: MỌI khoá alias phải sinh slug KHÔNG chứa ký tự > U+00FF", () => {
    const pham = Object.keys(ALIAS_HOP_CHAT)
      .map((k) => ({ k, slug: decodeURIComponent(slugHoaHopChat(k)) }))
      .filter(({ slug }) => coKyTuNgoaiLatin1(slug));
    expect(pham).toEqual([]);
  });

  it.fails("nước → nuoc", () => expect(decodeURIComponent(slugHoaHopChat("nước"))).toBe("nuoc"));
  it.fails("muối ăn → muoi-an", () => expect(decodeURIComponent(slugHoaHopChat("muối ăn"))).toBe("muoi-an"));
  it.fails("đá vôi → da-voi", () => expect(decodeURIComponent(slugHoaHopChat("đá vôi"))).toBe("da-voi"));
  it.fails("thuốc tím → thuoc-tim", () => expect(decodeURIComponent(slugHoaHopChat("thuốc tím"))).toBe("thuoc-tim"));
});

describe("boSlugHopChat — KHÔNG được phá danh pháp IUPAC (PHA 2 sẽ sửa)", () => {
  it.fails("BUG: gạch nối trong tên hoá học CÓ nghĩa, không được biến thành dấu cách", () => {
    // PubChem: '1,3,7-trimethylxanthine' → 200 ; '1,3,7 trimethylxanthine' → 404
    expect(boSlugHopChat("1,3,7-trimethylxanthine")).toBe("1,3,7-trimethylxanthine");
    expect(boSlugHopChat("cis-platin")).toBe("cis-platin");
    expect(boSlugHopChat("n-hexane")).toBe("n-hexane");
    expect(boSlugHopChat("D-fructose")).toBe("D-fructose");
  });
});
