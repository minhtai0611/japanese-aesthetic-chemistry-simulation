import { describe, it, expect } from "vitest";
import { levenshteinDistance, suggestClosestMatch } from "@/lib/levenshtein";

describe("khoangCachLevenshtein", () => {
  it("chuỗi giống hệt → 0", () => expect(levenshteinDistance("caffeine", "caffeine")).toBe(0));
  it("chuỗi rỗng → độ dài chuỗi kia", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });
  it("1 ký tự khác nhau → 1", () => expect(levenshteinDistance("cat", "bat")).toBe(1));
  it("chèn/xoá được tính đúng", () => expect(levenshteinDistance("caffein", "caffeine")).toBe(1));
});

describe("goiYGanDung", () => {
  const taiLieu = ["caffeine", "aspirin", "benzene", "glucose", "ethanol"];
  it("gõ gần đúng vẫn tìm ra ứng viên đúng", () => {
    expect(suggestClosestMatch("cafein", taiLieu)).toContain("caffeine");
  });
  it("không có ứng viên hợp lý → mảng rỗng", () => {
    expect(suggestClosestMatch("xyz123nonsense", taiLieu)).toEqual([]);
  });
  it("từ khoá rỗng → mảng rỗng", () => expect(suggestClosestMatch("", taiLieu)).toEqual([]));
});
