/**
 * Đồng bộ compound_cache + compound_aliases từ CHÍNH dữ liệu đã có trong repo
 * (HOP_CHAT_NOI_BAT + ALIAS_HOP_CHAT) — không bịa alias mới. Với mỗi chất
 * duy nhất, gọi PubChem thật (qua semaphore có sẵn trong pubchem.ts) để lấy
 * thuộc tính + kiểm tra có conformer 3D không, rồi ghi nhận:
 *   - daXacThuc = true CHỈ khi PubChem trả về thành công thật (không suy đoán)
 *   - co3D = true/false theo kết quả gọi record_type=3d thật
 *   - laGiaoDuc = true (mọi chất trong danh mục này, theo định nghĩa)
 *
 * Dùng chung bởi scripts/seed-compounds.ts (chạy tay) và
 * /api/cron/sync (chạy định kỳ trên Vercel) — một nguồn logic, không lặp code.
 */
import { db } from "@/db";
import { compoundCache, compoundAliases } from "@/db/schema";
import { sql } from "drizzle-orm";
import { layHopChat, layHopChat3D } from "@/lib/pubchem";
import { ALIAS_HOP_CHAT } from "@/lib/alias-hop-chat";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";

interface AliasEntry {
  alias: string;
  ngonNgu: "vi" | "en";
}

export interface KetQuaDongBoChat {
  ten: string;
  ok: boolean;
  cid?: number;
  co3D?: boolean;
}

function thuThapAlias(): Map<string, AliasEntry[]> {
  const theoTen = new Map<string, AliasEntry[]>();
  const them = (ten: string, alias: string, ngonNgu: "vi" | "en") => {
    const ds = theoTen.get(ten) ?? [];
    if (!ds.some((a) => a.alias === alias)) ds.push({ alias, ngonNgu });
    theoTen.set(ten, ds);
  };

  for (const [vi, en] of Object.entries(ALIAS_HOP_CHAT)) {
    them(en, vi, "vi");
    them(en, en, "en");
  }
  for (const c of HOP_CHAT_NOI_BAT) {
    them(c.ten, c.nhan, "vi");
    them(c.ten, c.ten, "en");
  }
  return theoTen;
}

async function dongBoMotChat(ten: string, aliases: AliasEntry[]): Promise<KetQuaDongBoChat> {
  const thuocTinh = await layHopChat(ten);
  if (!thuocTinh) return { ten, ok: false };

  const baChieu = await layHopChat3D(ten, thuocTinh);
  const co3D = baChieu !== null;

  // conformers3d lưu đúng hình dạng { nguyenTu, lienKet } mà layConformerTuCache
  // (src/lib/pubchem.ts) đọc lại — null khi không có 3D, không suy đoán dữ liệu.
  const conformers3d = baChieu ? { nguyenTu: baChieu.nguyenTu, lienKet: baChieu.lienKet } : null;

  await db
    .insert(compoundCache)
    .values({
      cid: thuocTinh.cid,
      tenTruyVan: ten,
      congThuc: thuocTinh.congThuc,
      khoiLuongMol: thuocTinh.khoiLuongMol,
      iupac: thuocTinh.iupac,
      smiles: thuocTinh.smiles,
      inchikey: thuocTinh.inchikey,
      xLogP: thuocTinh.xLogP,
      co3D,
      conformers3d,
      laGiaoDuc: true,
      daXacThuc: true,
      xacThucLuc: sql`now()`,
    })
    .onConflictDoUpdate({
      target: compoundCache.cid,
      set: {
        tenTruyVan: ten,
        congThuc: thuocTinh.congThuc,
        khoiLuongMol: thuocTinh.khoiLuongMol,
        iupac: thuocTinh.iupac,
        smiles: thuocTinh.smiles,
        inchikey: thuocTinh.inchikey,
        xLogP: thuocTinh.xLogP,
        co3D,
        conformers3d,
        laGiaoDuc: true,
        daXacThuc: true,
        xacThucLuc: sql`now()`,
        capNhatLuc: sql`now()`,
      },
    });

  for (const { alias, ngonNgu } of aliases) {
    await db
      .insert(compoundAliases)
      .values({ cid: thuocTinh.cid, alias, ngonNgu })
      .onConflictDoNothing();
  }

  return { ten, ok: true, cid: thuocTinh.cid, co3D };
}

/** Đồng bộ toàn bộ danh mục giáo dục. Trả về kết quả từng chất để log/báo cáo. */
export async function dongBoHopChatGiaoDuc(): Promise<KetQuaDongBoChat[]> {
  const theoTen = thuThapAlias();
  const dsTen = [...theoTen.keys()];
  return Promise.all(dsTen.map((ten) => dongBoMotChat(ten, theoTen.get(ten)!)));
}
