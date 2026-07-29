import { describe, it, expect } from "vitest";
import {
  boDauTiengViet,
  slugCanonical,
  canRedirect,
  cacBienTheTraCuu,
  traAlias,
  laChatGiaoDuc,
  CHAT_GIAO_DUC,
} from "@/lib/dinh-danh-chat";

describe("boDauTiengViet", () => {
  it("bỏ dấu thanh điệu và nguyên âm mở rộng, giữ đ→d", () => {
    expect(boDauTiengViet("đường")).toBe("duong");
    expect(boDauTiengViet("Đá Vôi")).toBe("Da Voi");
    expect(boDauTiengViet("nước")).toBe("nuoc");
  });
  it("chuỗi ASCII thuần không đổi", () => {
    expect(boDauTiengViet("caffeine")).toBe("caffeine");
  });
});

describe("slugCanonical", () => {
  it("BUG 500 gốc: mọi output đều là ASCII an toàn cho dynamic segment (không ký tự > U+00FF)", () => {
    for (const input of ["nước", "muối ăn", "đá vôi", "thuốc tím", "Xesi", "Đồng"]) {
      const slug = slugCanonical(input);
      expect([...slug].every((c) => c.codePointAt(0)! <= 0xff)).toBe(true);
    }
  });

  it("giữ nguyên gạch nối/dấu phẩy có nghĩa hoá học (IUPAC)", () => {
    expect(slugCanonical("1,3,7-trimethylxanthine")).toBe("1,3,7-trimethylxanthine");
    expect(slugCanonical("cis-platin")).toBe("cis-platin");
  });

  it("khoảng trắng → gạch nối, gộp gạch nối liên tiếp, cắt gạch nối đầu/cuối", () => {
    expect(slugCanonical("muối ăn")).toBe("muoi-an");
    expect(slugCanonical("  đá   vôi  ")).toBe("da-voi");
  });

  it("là hàm idempotent: canonical hoá lần hai không đổi kết quả", () => {
    for (const input of ["nước", "1,3,7-trimethylxanthine", "  Đá Vôi "]) {
      const once = slugCanonical(input);
      expect(slugCanonical(once)).toBe(once);
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
    expect(cacBienTheTraCuu("1,3,7-trimethylxanthine")[0]).toBe("1,3,7-trimethylxanthine");
    expect(cacBienTheTraCuu("cis-platin")[0]).toBe("cis-platin");
  });

  it("BUG P0-2: slug alias tiếng Việt phải tìm ra được tên PubChem thật qua ít nhất một biến thể", () => {
    expect(cacBienTheTraCuu("nuoc")).toContain("water");
    expect(cacBienTheTraCuu("da-voi")).toContain("calcium carbonate");
    expect(cacBienTheTraCuu("thuoc-tim")).toContain("potassium permanganate");
  });
});

describe("traAlias", () => {
  it("'nuoc', 'nước', 'NƯỚC' đều khớp cùng một bản dịch", () => {
    expect(traAlias("nuoc")).toBe("water");
    expect(traAlias("nước")).toBe("water");
    expect(traAlias("NƯỚC")).toBe("water");
  });
  it("không khớp alias nào → null", () => expect(traAlias("caffeine")).toBeNull());
});

describe("CHAT_GIAO_DUC / laChatGiaoDuc", () => {
  it("suy ra từ dữ liệu thật trong repo, không rỗng", () => {
    expect(CHAT_GIAO_DUC.length).toBeGreaterThan(0);
  });

  it("BUG P0-5: chất nổi bật + alias tiếng Việt thuộc whitelist giáo dục", () => {
    expect(laChatGiaoDuc("caffeine")).toBe(true);
    expect(laChatGiaoDuc("nuoc")).toBe(true);
    expect(laChatGiaoDuc("nước")).toBe(true);
  });

  it("BUG P0-5: tên lóng chất kích thích KHÔNG thuộc whitelist giáo dục", () => {
    expect(laChatGiaoDuc("love")).toBe(false);
    expect(laChatGiaoDuc("sunshine")).toBe(false);
  });
});
