/**
 * Đối chiếu tinhKhoiLuongMol (parser + khử Gauss của PHA 5) với khối lượng
 * mol THẬT của PubChem trên 200 chất — biến chính nguồn dữ liệu thành bộ
 * kiểm tra cho code của mình.
 *
 * Dùng CID 1..200 (mã định danh thật của PubChem) thay vì tự chọn tên chất —
 * tránh tự bịa một danh sách 200 chất, và cho kết quả tái lập được.
 *
 * KHÔNG chạy trong CI/`npm test` — cần mạng thật tới PubChem, mất vài phút
 * (semaphore trong pubchem.ts tự giới hạn tốc độ). Chạy tay khi cần đối
 * chiếu: `npx tsx scripts/doi-chieu-khoi-luong-mol.ts`.
 */
import "dotenv/config";
import { layTatCaNguyenTo, layHopChat } from "../src/lib/pubchem";
import { phanTichCongThuc } from "../src/lib/hoa-hoc/parser-cong-thuc";
import { tinhKhoiLuongMol, bangKhoiLuongTheoKyHieu, doiChieuKhoiLuongMol } from "../src/lib/hoa-hoc/khoi-luong-mol";

const SO_CHAT = 200;

async function main() {
  const nguyenTo = await layTatCaNguyenTo();
  const bangKL = bangKhoiLuongTheoKyHieu(nguyenTo);
  console.log(`Bảng khối lượng nguyên tử: ${bangKL.size}/118 nguyên tố có giá trị đo được từ PubChem.`);

  const cidMau = Array.from({ length: SO_CHAT }, (_, i) => String(i + 1));

  let soKiemDuoc = 0;
  let soBoQuaKhongCoDuLieu = 0;
  let soBoQuaNguyenToLa = 0;
  let soCanhBao = 0;
  const canhBaoChiTiet: string[] = [];

  for (const cid of cidMau) {
    const hc = await layHopChat(cid);
    if (!hc || !hc.congThuc || hc.khoiLuongMol == null) {
      soBoQuaKhongCoDuLieu++;
      continue;
    }

    let bangNguyenTu: Record<string, number>;
    try {
      bangNguyenTu = phanTichCongThuc(hc.congThuc);
    } catch {
      soBoQuaKhongCoDuLieu++; // công thức PubChem có ký hiệu parser hiện chưa xử lý (vd. đồng vị D/T)
      continue;
    }

    let mTinh: number;
    try {
      mTinh = tinhKhoiLuongMol(bangNguyenTu, bangKL);
    } catch {
      soBoQuaNguyenToLa++;
      continue;
    }

    soKiemDuoc++;
    const kq = doiChieuKhoiLuongMol(mTinh, hc.khoiLuongMol);
    if (kq.canhBao) {
      soCanhBao++;
      canhBaoChiTiet.push(
        `CID ${cid} (${hc.congThuc}): tính=${mTinh.toFixed(3)} pubchem=${hc.khoiLuongMol} lệch=${(kq.lech * 100).toFixed(2)}%`,
      );
    }
  }

  console.log(
    `\nĐối chiếu ${soKiemDuoc}/${SO_CHAT} chất (bỏ qua ${soBoQuaKhongCoDuLieu} không đủ dữ liệu/parser, ${soBoQuaNguyenToLa} có nguyên tố lạ).`,
  );
  console.log(`Cảnh báo lệch > 0.5%: ${soCanhBao}/${soKiemDuoc}.`);
  canhBaoChiTiet.forEach((d) => console.log(" -", d));
  process.exit(0);
}

main();
