/**
 * Bộ mở rộng cấu hình electron dạng rút gọn khí hiếm, ví dụ "[Rn] 5f14 6d10 7s2 7p2".
 *
 * PubChem trả cấu hình electron ở dạng lồng nhau: mỗi nguyên tố tham chiếu tới khí hiếm
 * gần nhất ("[Xe]", "[Rn]"…), và bản thân khí hiếm đó lại được biểu diễn bằng khí hiếm
 * trước nó ("[Xe]" = "[Kr] 4d10 5s2 5p6"). Chuỗi lồng khí hiếm dài nhất trong bảng tuần
 * hoàn (Og, Z=118) đi qua Rn → Xe → Kr → Ar → Ne → He — 5 lượt thay thế. Bản gốc giới hạn
 * đệ quy ở 4 lượt nên toàn bộ 32 nguyên tố có lõi [Rn] (Z 87–118) bị rơi về lớp vỏ rỗng.
 */
export function lopVoTuCauHinh(cauHinh: string, theoKyHieu: Map<string, { cauHinhElectron: string }>): number[] {
  const lop = new Array<number>(7).fill(0);
  if (!cauHinh) return lop.filter((x) => x > 0);

  let cfg = cauHinh;
  // Trần vòng lặp rộng rãi so với độ sâu lồng khí hiếm thật (tối đa 5) để an toàn với dữ liệu tương lai.
  for (let vongLap = 0; vongLap < 12 && cfg.includes("["); vongLap++) {
    const truoc = cfg;
    cfg = cfg.replace(/\[([A-Za-z]{1,2})\]/g, (khop, kyHieu: string) => {
      const loi = theoKyHieu.get(kyHieu);
      return loi?.cauHinhElectron ? ` ${loi.cauHinhElectron} ` : "";
    });
    if (cfg === truoc) break; // ký hiệu không giải được (dữ liệu lạ) — tránh vòng lặp vô ích
  }

  const bm = /(\d)([spdf])(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = bm.exec(cfg))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 7) lop[n - 1] += Number(m[3]);
  }
  return lop.filter((x) => x > 0);
}
