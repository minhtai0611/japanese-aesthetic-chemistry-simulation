/**
 * One-off CLI for src/lib/compound-sync.ts — see that file for the full
 * logic (shared with /api/cron/sync).
 *
 * Usage: npx tsx scripts/seed-compounds.ts
 */
import "dotenv/config";
import { syncEducationalCompound } from "../src/lib/compound-sync";

async function main() {
  console.log("Đồng bộ danh mục giáo dục (semaphore trong pubchem.ts tự giới hạn đồng thời)…");
  const results = await syncEducationalCompound();

  for (const r of results) {
    console.log(r.ok ? `  ✓ ${r.name}: CID ${r.cid}, 3D=${r.has3D}` : `  ✗ ${r.name}: PubChem không trả về thuộc tính — bỏ qua`);
  }

  const successCount = results.filter((r) => r.ok).length;
  console.log(`\nXong: ${successCount}/${results.length} chất xác thực thành công.`);
  if (successCount < results.length) {
    console.log("Chất KHÔNG xác thực được:", results.filter((r) => !r.ok).map((r) => r.name).join(", "));
  }
  process.exit(0);
}

main();
