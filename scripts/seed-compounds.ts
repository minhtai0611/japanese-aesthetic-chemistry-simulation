/**
 * CLI một lần cho scripts/dong-bo-hop-chat.ts — xem file đó để biết logic đầy
 * đủ (dùng chung với /api/cron/sync).
 *
 * Dùng: npx tsx scripts/seed-compounds.ts
 */
import "dotenv/config";
import { dongBoHopChatGiaoDuc } from "../src/lib/dong-bo-hop-chat";

async function main() {
  console.log("Đồng bộ danh mục giáo dục (semaphore trong pubchem.ts tự giới hạn đồng thời)…");
  const ketQua = await dongBoHopChatGiaoDuc();

  for (const r of ketQua) {
    console.log(r.ok ? `  ✓ ${r.ten}: CID ${r.cid}, 3D=${r.co3D}` : `  ✗ ${r.ten}: PubChem không trả về thuộc tính — bỏ qua`);
  }

  const thanhCong = ketQua.filter((r) => r.ok).length;
  console.log(`\nXong: ${thanhCong}/${ketQua.length} chất xác thực thành công.`);
  if (thanhCong < ketQua.length) {
    console.log("Chất KHÔNG xác thực được:", ketQua.filter((r) => !r.ok).map((r) => r.ten).join(", "));
  }
  process.exit(0);
}

main();
