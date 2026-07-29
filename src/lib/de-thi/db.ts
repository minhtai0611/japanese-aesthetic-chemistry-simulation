/**
 * Lớp CRUD cho bộ đề — tra dữ liệu thật (PubChem/nguyên tố) rồi gọi sinh-de.ts
 * (thuần túy, không mạng) để tạo câu hỏi, lưu kết quả sinh ra (KHÔNG sinh lại
 * mỗi lần học sinh mở /de/{ma}, để đề không đổi giữa hai lượt tải trang).
 */
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { baiTap, boDe, ketQuaBaiTap } from "@/db/schema";
import { taoMaNgauNhien } from "@/lib/ma-ngau-nhien";
import { layHopChat, layTatCaNguyenTo } from "@/lib/pubchem";
import { HOP_CHAT_NOI_BAT } from "@/lib/hop-chat-noi-bat";
import { sinhDeTheoPhong, chamDiem, type DuLieuSinhDe } from "@/lib/de-thi/sinh-de";
import type { SlugPhong } from "@/lib/phong-thi-nghiem";

const SO_LAN_THU_MA = 5;

async function chuanBiDuLieuSinhDe(loaiPhong: SlugPhong, seed: number): Promise<DuLieuSinhDe> {
  if (loaiPhong === "chuan-do" || loaiPhong === "can-bang") {
    return { loaiPhong };
  }
  if (loaiPhong === "pha-che") {
    const goc = HOP_CHAT_NOI_BAT[seed % HOP_CHAT_NOI_BAT.length];
    const hopChat = await layHopChat(goc.ten);
    if (!hopChat?.khoiLuongMol) {
      throw new Error(`PubChem không trả về khối lượng mol cho "${goc.ten}" — không sinh được đề pha chế.`);
    }
    const nhan = goc.nhan.split(" — ")[0]; // "Benzene — vòng thơm" → "Benzene"; "Nước" giữ nguyên
    return { loaiPhong, chat: { nhan, M: hopChat.khoiLuongMol } };
  }
  // chuyen-pha
  const nguyenTo = await layTatCaNguyenTo();
  const ungVien = nguyenTo
    .filter((n) => n.nongChayK !== null)
    .map((n) => ({ tenVi: n.tenVi, kyHieu: n.kyHieu, nongChayK: n.nongChayK! }));
  return { loaiPhong, ungVien };
}

export interface CauHoiSinhRa {
  thuTu: number;
  seed: number;
  de: string;
  dapAn: number;
  dungSai: number;
  loiGiai: string;
}

export interface TaoBoDeDauVao {
  ten: string;
  lop?: string;
  loaiPhong: SlugPhong;
  soCau: number;
}

export async function taoBoDe(dauVao: TaoBoDeDauVao): Promise<{ ma: string; maQuanTri: string; cauHoi: CauHoiSinhRa[] }> {
  const seedGoc = Math.floor(Math.random() * 1_000_000);
  const cauHoi: CauHoiSinhRa[] = [];
  for (let i = 0; i < dauVao.soCau; i++) {
    const seed = seedGoc + i;
    const duLieu = await chuanBiDuLieuSinhDe(dauVao.loaiPhong, seed);
    const bt = sinhDeTheoPhong(seed, duLieu);
    cauHoi.push({ thuTu: i + 1, seed, ...bt });
  }

  let ma = "";
  for (let lan = 0; lan < SO_LAN_THU_MA; lan++) {
    const ungCu = taoMaNgauNhien(6);
    const [dong] = await db
      .insert(boDe)
      .values({ ma: ungCu, maQuanTri: taoMaNgauNhien(10), ten: dauVao.ten, lop: dauVao.lop })
      .onConflictDoNothing({ target: boDe.ma })
      .returning();
    if (dong) {
      ma = dong.ma;
      await db.insert(baiTap).values(
        cauHoi.map((c) => ({
          boDeId: dong.id,
          thuTu: c.thuTu,
          loaiPhong: dauVao.loaiPhong,
          seed: c.seed,
          de: c.de,
          dapAn: c.dapAn,
          dungSai: c.dungSai,
          loiGiai: c.loiGiai,
        })),
      );
      return { ma, maQuanTri: dong.maQuanTri, cauHoi };
    }
  }
  throw new Error("Không tạo được mã đề duy nhất sau nhiều lần thử — thử lại.");
}

export interface CauHoiChoHocSinh {
  id: number;
  thuTu: number;
  de: string;
}

export async function layBoDeTheoMa(ma: string): Promise<{ ten: string; lop: string | null; cauHoi: CauHoiChoHocSinh[] } | null> {
  const [boDeDong] = await db.select().from(boDe).where(eq(boDe.ma, ma));
  if (!boDeDong) return null;

  const cauHoi = await db
    .select({ id: baiTap.id, thuTu: baiTap.thuTu, de: baiTap.de })
    .from(baiTap)
    .where(eq(baiTap.boDeId, boDeDong.id))
    .orderBy(asc(baiTap.thuTu));

  return { ten: boDeDong.ten, lop: boDeDong.lop, cauHoi };
}

export interface TraLoiHocSinh {
  baiTapId: number;
  traLoi: number;
}

export interface KetQuaCauHoi {
  baiTapId: number;
  thuTu: number;
  dung: boolean;
  dapAn: number;
  loiGiai: string;
}

export async function nopBai(
  ma: string,
  clientId: string,
  traLoi: TraLoiHocSinh[],
): Promise<{ ok: true; ketQua: KetQuaCauHoi[] } | { ok: false; loi: string }> {
  const [boDeDong] = await db.select().from(boDe).where(eq(boDe.ma, ma));
  if (!boDeDong) return { ok: false, loi: `Không tìm thấy đề "${ma}".` };

  const cauHoi = await db.select().from(baiTap).where(eq(baiTap.boDeId, boDeDong.id));
  const theoId = new Map(cauHoi.map((c) => [c.id, c]));

  const ketQua: KetQuaCauHoi[] = [];
  for (const { baiTapId, traLoi: giaTri } of traLoi) {
    const bt = theoId.get(baiTapId);
    if (!bt) continue; // câu không thuộc bộ đề này — bỏ qua thay vì báo lỗi cả lượt nộp
    const dung = chamDiem(giaTri, bt.dapAn, bt.dungSai);
    await db
      .insert(ketQuaBaiTap)
      .values({ clientId, baiTapId, traLoi: giaTri, dung })
      .onConflictDoUpdate({
        target: [ketQuaBaiTap.clientId, ketQuaBaiTap.baiTapId],
        set: { traLoi: giaTri, dung },
      });
    ketQua.push({ baiTapId, thuTu: bt.thuTu, dung, dapAn: bt.dapAn, loiGiai: bt.loiGiai });
  }
  ketQua.sort((a, b) => a.thuTu - b.thuTu);
  return { ok: true, ketQua };
}

export interface HangHocSinh {
  clientId: string;
  soDung: number;
  soCau: number;
  chiTiet: { thuTu: number; de: string; traLoi: number | null; dapAn: number; dung: boolean }[];
}

export async function layKetQuaBoDe(
  ma: string,
  maQuanTri: string,
): Promise<{ ok: true; ten: string; lop: string | null; hocSinh: HangHocSinh[] } | { ok: false; loi: string }> {
  const [boDeDong] = await db.select().from(boDe).where(eq(boDe.ma, ma));
  if (!boDeDong) return { ok: false, loi: `Không tìm thấy đề "${ma}".` };
  if (boDeDong.maQuanTri !== maQuanTri) return { ok: false, loi: "Mã quản trị không đúng." };

  const cauHoi = await db
    .select()
    .from(baiTap)
    .where(eq(baiTap.boDeId, boDeDong.id))
    .orderBy(asc(baiTap.thuTu));

  const nopRoi = await db
    .select({
      clientId: ketQuaBaiTap.clientId,
      baiTapId: ketQuaBaiTap.baiTapId,
      traLoi: ketQuaBaiTap.traLoi,
      dung: ketQuaBaiTap.dung,
    })
    .from(ketQuaBaiTap)
    .innerJoin(baiTap, eq(ketQuaBaiTap.baiTapId, baiTap.id))
    .where(eq(baiTap.boDeId, boDeDong.id));

  const theoHocSinh = new Map<string, Map<number, { traLoi: number; dung: boolean }>>();
  for (const dong of nopRoi) {
    const bang = theoHocSinh.get(dong.clientId) ?? new Map();
    bang.set(dong.baiTapId, { traLoi: dong.traLoi, dung: dong.dung });
    theoHocSinh.set(dong.clientId, bang);
  }

  const hocSinh: HangHocSinh[] = [...theoHocSinh.entries()].map(([clientId, bang]) => {
    const chiTiet = cauHoi.map((c) => {
      const traLoi = bang.get(c.id);
      return { thuTu: c.thuTu, de: c.de, traLoi: traLoi?.traLoi ?? null, dapAn: c.dapAn, dung: traLoi?.dung ?? false };
    });
    return {
      clientId,
      soDung: chiTiet.filter((c) => c.dung).length,
      soCau: cauHoi.length,
      chiTiet,
    };
  });
  hocSinh.sort((a, b) => b.soDung - a.soDung);

  return { ok: true, ten: boDeDong.ten, lop: boDeDong.lop, hocSinh };
}

function thoatCSV(gia: string): string {
  if (/[",\n]/.test(gia)) return `"${gia.replace(/"/g, '""')}"`;
  return gia;
}

export async function xuatCSV(ma: string, maQuanTri: string): Promise<{ ok: true; csv: string } | { ok: false; loi: string }> {
  const ketQua = await layKetQuaBoDe(ma, maQuanTri);
  if (!ketQua.ok) return ketQua;

  const soCauToiDa = Math.max(0, ...ketQua.hocSinh.map((h) => h.soCau));
  const dongTieuDe = ["client_id", "so_dung", "so_cau", ...Array.from({ length: soCauToiDa }, (_, i) => `cau_${i + 1}`)];
  const dong = ketQua.hocSinh.map((h) => [
    h.clientId,
    String(h.soDung),
    String(h.soCau),
    ...h.chiTiet.map((c) => (c.traLoi === null ? "" : `${c.traLoi}${c.dung ? " (đúng)" : " (sai)"}`)),
  ]);

  const csv = [dongTieuDe, ...dong].map((hang) => hang.map(thoatCSV).join(",")).join("\r\n");
  return { ok: true, csv };
}
