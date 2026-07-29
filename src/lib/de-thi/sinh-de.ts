/**
 * Sinh đề bài tất định — mulberry32(seed) + template toán học + dữ liệu thật
 * (PubChem, bảng nguyên tố, phương trình đã kiểm chứng cân bằng được).
 * KHÔNG dùng AI: đề là số ngẫu nhiên có seed (cùng seed ⇒ cùng đề, tái lập
 * được, chia sẻ được) ghép vào công thức đã biết. Chấm điểm = so khớp số
 * trong dung sai — không suy luận ngôn ngữ tự nhiên.
 *
 * Các hàm sinhDe* nhận dữ liệu PubChem/nguyên tố ĐÃ TRA XONG qua tham số —
 * không tự gọi mạng — để giữ chúng thuần túy, tất định và test được không
 * cần DB/mạng. Việc tra dữ liệu thật thuộc về route gọi hàm này.
 */
import { theTichTuongDuong } from "@/lib/hoa-hoc/chuan-do";
import { canBang } from "@/lib/hoa-hoc/can-bang";
import { VI_DU_PHUONG_TRINH } from "@/lib/hoa-hoc/vi-du-phuong-trinh";
import type { SlugPhong } from "@/lib/phong-thi-nghiem";

/** mulberry32 — PRNG 32-bit công khai, chu kỳ 2³², đủ tốt cho sinh đề (không cần bảo mật mật mã). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BaiTapSinhRa {
  de: string;
  dapAn: number;
  /** Sai số TUYỆT ĐỐI cho phép, cùng đơn vị với dapAn (0 = phải khớp chính xác, dùng cho hệ số nguyên). */
  dungSai: number;
  loiGiai: string;
}

interface ChatChoBaiTap {
  nhan: string;
  M: number;
}

interface NguyenToChoBaiTap {
  tenVi: string;
  kyHieu: string;
  nongChayK: number;
}

/** Phòng pha chế — "cần bao nhiêu gam để pha X mL dung dịch Y M?" (n = C×V, m = n×M). */
export function sinhDeNongDo(seed: number, chat: ChatChoBaiTap): BaiTapSinhRa {
  const r = mulberry32(seed);
  const C = Math.round((0.1 + r() * 1.9) * 100) / 100; // 0,1–2,0 M
  const V = Math.round((50 + r() * 450) / 50) * 50; // 50–500 mL, chia hết cho 50
  const n = (C * V) / 1000;
  const dapAn = n * chat.M;
  return {
    de: `Cần bao nhiêu gam ${chat.nhan} để pha ${V} mL dung dịch ${C.toFixed(2)} M?`,
    dapAn,
    dungSai: Math.max(dapAn * 0.01, 0.01),
    loiGiai:
      `n = C×V = ${C.toFixed(2)} × ${(V / 1000).toFixed(3)} = ${n.toFixed(4)} mol\n` +
      `m = n×M = ${n.toFixed(4)} × ${chat.M} = ${dapAn.toFixed(2)} g`,
  };
}

/** Phòng chuẩn độ — thể tích bazơ cần để trung hòa vừa đủ (Ca×Va = Cb×Vb), không cần dữ liệu ngoài. */
export function sinhDeChuanDo(seed: number): BaiTapSinhRa {
  const r = mulberry32(seed);
  const Ca = Math.round((0.05 + r() * 0.95) * 100) / 100; // 0,05–1,0 M
  const Va = Math.round((10 + r() * 40) / 5) * 5; // 10–50 mL, chia hết cho 5
  const Cb = Math.round((0.05 + r() * 0.95) * 100) / 100;
  const dapAn = theTichTuongDuong(Ca, Va, Cb);
  return {
    de: `Cần bao nhiêu mL dung dịch bazơ mạnh ${Cb.toFixed(2)} M để trung hòa vừa đủ ${Va} mL dung dịch axit mạnh ${Ca.toFixed(2)} M?`,
    dapAn,
    dungSai: Math.max(dapAn * 0.01, 0.1),
    loiGiai:
      `Tại điểm tương đương: n(H⁺) = n(OH⁻) ⇒ Ca×Va = Cb×Vb\n` +
      `Vb = (${Ca.toFixed(2)} × ${Va}) / ${Cb.toFixed(2)} = ${dapAn.toFixed(2)} mL`,
  };
}

/** Phòng chuyển pha — điểm nóng chảy thật (K → °C) của một nguyên tố có đủ dữ liệu PubChem. */
export function sinhDeChuyenPha(seed: number, ungVien: NguyenToChoBaiTap[]): BaiTapSinhRa {
  if (ungVien.length === 0) {
    throw new Error("Không có nguyên tố nào đủ dữ liệu nóng chảy để sinh đề chuyển pha.");
  }
  const r = mulberry32(seed);
  const nt = ungVien[Math.floor(r() * ungVien.length)];
  const dapAnC = Math.round((nt.nongChayK - 273.15) * 10) / 10;
  return {
    de: `${nt.tenVi} (${nt.kyHieu}) nóng chảy (chuyển từ rắn sang lỏng) ở bao nhiêu °C? (số liệu PubChem, làm tròn 1 chữ số)`,
    dapAn: dapAnC,
    dungSai: 2, // ±2 °C: đủ hẹp để không trùng đáp án nguyên tố khác, đủ rộng cho sai số làm tròn tay
    loiGiai: `Điểm nóng chảy PubChem của ${nt.tenVi}: ${nt.nongChayK} K − 273,15 = ${dapAnC.toFixed(1)} °C`,
  };
}

/** Phòng cân bằng — hệ số của một chất trong phương trình đã kiểm chứng cân bằng được (Gauss-Jordan). */
export function sinhDeCanBang(seed: number): BaiTapSinhRa {
  const r = mulberry32(seed);
  const vd = VI_DU_PHUONG_TRINH[Math.floor(r() * VI_DU_PHUONG_TRINH.length)];
  const veTrai = vd.trai.split("+").map((s) => s.trim());
  const vePhai = vd.phai.split("+").map((s) => s.trim());
  const ketQua = canBang(veTrai, vePhai);
  if (!ketQua.ok) {
    throw new Error(`Phương trình mẫu "${vd.trai} → ${vd.phai}" không cân bằng được — kiểm tra VI_DU_PHUONG_TRINH.`);
  }

  const tongSoChat = veTrai.length + vePhai.length;
  const chiSo = Math.floor(r() * tongSoChat);
  const beTrai = chiSo < veTrai.length;
  const chat = beTrai ? veTrai[chiSo] : vePhai[chiSo - veTrai.length];
  const heSo = beTrai ? ketQua.heSoTrai[chiSo] : ketQua.heSoPhai[chiSo - veTrai.length];

  const veChuoi = (chat_: string[], heSo_: number[]) =>
    chat_.map((c, i) => `${heSo_[i] > 1 ? heSo_[i] : ""}${c}`).join(" + ");

  return {
    de: `Cân bằng phương trình: ${vd.trai} → ${vd.phai}. Hệ số của ${chat} là bao nhiêu?`,
    dapAn: heSo,
    dungSai: 0, // hệ số nguyên — phải khớp chính xác
    loiGiai:
      `Phương trình cân bằng: ${veChuoi(veTrai, ketQua.heSoTrai)} → ${veChuoi(vePhai, ketQua.heSoPhai)}\n` +
      `Hệ số của ${chat} = ${heSo}`,
  };
}

/** Dữ liệu cần tra TRƯỚC khi sinh đề — route chịu trách nhiệm gọi PubChem/DB rồi mới gọi hàm này. */
export type DuLieuSinhDe =
  | { loaiPhong: "pha-che"; chat: ChatChoBaiTap }
  | { loaiPhong: "chuan-do" }
  | { loaiPhong: "chuyen-pha"; ungVien: NguyenToChoBaiTap[] }
  | { loaiPhong: "can-bang" };

export function sinhDeTheoPhong(seed: number, duLieu: DuLieuSinhDe): BaiTapSinhRa {
  switch (duLieu.loaiPhong) {
    case "pha-che":
      return sinhDeNongDo(seed, duLieu.chat);
    case "chuan-do":
      return sinhDeChuanDo(seed);
    case "chuyen-pha":
      return sinhDeChuyenPha(seed, duLieu.ungVien);
    case "can-bang":
      return sinhDeCanBang(seed);
  }
}

/** Đối chiếu loaiPhong dùng chung type với CAC_PHONG — tránh 2 danh sách phòng lệch nhau. */
export type LoaiPhongDeThi = SlugPhong;

/** Chấm điểm số — sai số tuyệt đối, không suy luận ngôn ngữ tự nhiên, không AI. */
export function chamDiem(traLoi: number, dapAn: number, dungSai: number): boolean {
  return Math.abs(traLoi - dapAn) <= dungSai;
}
