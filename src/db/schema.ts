/**
 * Lớp lưu đệm + chỉ mục tìm kiếm nội bộ cho hợp chất/nguyên tố (Postgres).
 * Đây KHÔNG phải kho dữ liệu hóa học thay thế PubChem — chỉ lưu lại (cache) những
 * gì PubChem đã trả về, cộng với bảng alias tiếng Việt để tìm kiếm tốt hơn.
 * Kích hoạt: `npm run db:push` rồi seed alias qua `compound_aliases`/`element_aliases`.
 * Xem `docs/tim-kiem.md` để biết luồng tra cứu DB-trước/PubChem-sau.
 */
import { sql } from "drizzle-orm";
import { index, integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** Bản sao gọn các thuộc tính PubChem đã tra cứu — tránh gọi lại PUG-REST cho cùng CID */
export const compoundCache = pgTable(
  "compound_cache",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    tenTruyVan: text("ten_truy_van").notNull(),
    congThuc: text("cong_thuc"),
    khoiLuongMol: real("khoi_luong_mol"),
    iupac: text("iupac"),
    capNhatLuc: timestamp("cap_nhat_luc").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("compound_cache_cid_idx").on(t.cid)],
);

/** Alias tiếng Việt/tiếng Anh cho một CID — nguồn cho tìm kiếm full-text tsvector/GIN */
export const compoundAliases = pgTable(
  "compound_aliases",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    alias: text("alias").notNull(),
    ngonNgu: text("ngon_ngu").notNull().default("vi"), // "vi" | "en"
  },
  (t) => [
    uniqueIndex("compound_aliases_alias_cid_idx").on(t.alias, t.cid),
    // Chỉ mục biểu thức — tsvector tính khi truy vấn/insert, không cần cột generated.
    index("compound_aliases_tsv_idx").using("gin", sql`to_tsvector('simple', ${t.alias})`),
  ],
);

/** Hợp chất tiêu biểu có permalink /hop-chat/[slug] — nguồn cho generateStaticParams + sitemap */
export const featuredCompounds = pgTable(
  "featured_compounds",
  {
    id: serial("id").primaryKey(),
    cid: integer("cid").notNull(),
    slug: text("slug").notNull(),
    thuTu: integer("thu_tu").default(0).notNull(),
  },
  (t) => [uniqueIndex("featured_compounds_cid_idx").on(t.cid), uniqueIndex("featured_compounds_slug_idx").on(t.slug)],
);

/** Alias tiếng Việt cho nguyên tố — bổ sung cho TEN_VI tĩnh trong src/lib/nguyen-to.ts */
export const elementAliases = pgTable(
  "element_aliases",
  {
    id: serial("id").primaryKey(),
    soHieu: integer("so_hieu").notNull(), // số hiệu nguyên tử Z
    alias: text("alias").notNull(),
    ngonNgu: text("ngon_ngu").notNull().default("vi"),
  },
  (t) => [index("element_aliases_so_hieu_idx").on(t.soHieu)],
);

/** Nhật ký truy vấn không ra kết quả — nguồn để mở rộng alias tiếng Việt dần theo thời gian */
export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  tuKhoa: text("tu_khoa").notNull(),
  coKetQua: integer("co_ket_qua").notNull(), // 0 = không có kết quả, 1 = có
  taoLuc: timestamp("tao_luc").defaultNow().notNull(),
});
