CREATE TABLE "compound_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"cid" integer NOT NULL,
	"alias" text NOT NULL,
	"ngon_ngu" text DEFAULT 'vi' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compound_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cid" integer NOT NULL,
	"ten_truy_van" text NOT NULL,
	"cong_thuc" text,
	"khoi_luong_mol" real,
	"iupac" text,
	"cap_nhat_luc" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"so_hieu" integer NOT NULL,
	"alias" text NOT NULL,
	"ngon_ngu" text DEFAULT 'vi' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_compounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"cid" integer NOT NULL,
	"slug" text NOT NULL,
	"thu_tu" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tu_khoa" text NOT NULL,
	"co_ket_qua" integer NOT NULL,
	"tao_luc" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "compound_aliases_alias_cid_idx" ON "compound_aliases" USING btree ("alias","cid");--> statement-breakpoint
CREATE INDEX "compound_aliases_tsv_idx" ON "compound_aliases" USING gin (to_tsvector('simple', "alias"));--> statement-breakpoint
CREATE UNIQUE INDEX "compound_cache_cid_idx" ON "compound_cache" USING btree ("cid");--> statement-breakpoint
CREATE INDEX "element_aliases_so_hieu_idx" ON "element_aliases" USING btree ("so_hieu");--> statement-breakpoint
CREATE UNIQUE INDEX "featured_compounds_cid_idx" ON "featured_compounds" USING btree ("cid");--> statement-breakpoint
CREATE UNIQUE INDEX "featured_compounds_slug_idx" ON "featured_compounds" USING btree ("slug");