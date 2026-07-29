import { describe, it, expect } from "vitest";
import { khoangCachLevenshtein, goiYGanDung } from "@/lib/levenshtein";

describe("khoangCachLevenshtein", () => {
  it("chuỗi giống hệt → 0", () => expect(khoangCachLevenshtein("caffeine", "caffeine")).toBe(0));
  it("chuỗi rỗng → độ dài chuỗi kia", () => {
    expect(khoangCachLevenshtein("", "abc")).toBe(3);
    expect(khoangCachLevenshtein("abc", "")).toBe(3);
  });
  it("1 ký tự khác nhau → 1", () => expect(khoangCachLevenshtein("cat", "bat")).toBe(1));
  it("chèn/xoá được tính đúng", () => expect(khoangCachLevenshtein("caffein", "caffeine")).toBe(1));
});

describe("goiYGanDung", () => {
  const taiLieu = ["caffeine", "aspirin", "benzene", "glucose", "ethanol"];
  it("gõ gần đúng vẫn tìm ra ứng viên đúng", () => {
    expect(goiYGanDung("cafein", taiLieu)).toContain("caffeine");
  });
  it("không có ứng viên hợp lý → mảng rỗng", () => {
    expect(goiYGanDung("xyz123nonsense", taiLieu)).toEqual([]);
  });
  it("từ khoá rỗng → mảng rỗng", () => expect(goiYGanDung("", taiLieu)).toEqual([]));
});
