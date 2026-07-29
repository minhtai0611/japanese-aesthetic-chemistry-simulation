import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docClientId } from "@/lib/client-id";
import { laySoTayTheoId } from "@/lib/so-tay";
import { CAC_PHONG } from "@/lib/phong-thi-nghiem";
import { NGUON_DU_LIEU } from "@/lib/site";
import NutIn from "@/components/so-tay/nut-in";

export const metadata: Metadata = {
  title: "Báo cáo thí nghiệm",
  robots: { index: false, follow: false },
};

const TEN_PHONG = new Map(CAC_PHONG.map((p) => [p.slug, p.nhan]));
const CONG_THUC_PHONG = new Map(CAC_PHONG.map((p) => [p.slug, p.congThuc]));

/** Nhãn tiếng Việt + đơn vị cho các khoá thường gặp trong thamSo/ketQua của 4 phòng — phần còn lại hiện nguyên khoá. */
const NHAN_KHOA: Record<string, string> = {
  cheDo: "Chế độ",
  chat: "Chất tan",
  C: "Nồng độ C (mol/L)",
  V: "Thể tích V (mL)",
  C1: "Nồng độ gốc C₁ (mol/L)",
  C2: "Nồng độ mong muốn C₂ (mol/L)",
  V1: "Thể tích gốc V₁ (mL)",
  V2: "Thể tích mới V₂ (mL)",
  n: "Số mol n (mol)",
  m: "Khối lượng m (g)",
  Ca: "Nồng độ axit Cₐ (mol/L)",
  Cb: "Nồng độ bazơ C_b (mol/L)",
  Va: "Thể tích axit Vₐ (mL)",
  Vb: "Thể tích bazơ đã nhỏ Vb (mL)",
  pH: "pH",
  laDiemTuongDuong: "Là điểm tương đương",
  so: "Số hiệu nguyên tử Z",
  nhietDo: "Nhiệt độ (K)",
  trangThai: "Trạng thái",
  nongChayK: "Điểm nóng chảy (K)",
  soiK: "Điểm sôi (K)",
  veTrai: "Vế trái",
  vePhai: "Vế phải",
  heSoTrai: "Hệ số vế trái",
  heSoPhai: "Hệ số vế phải",
};

function hienGiaTri(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Đúng" : "Sai";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(3);
  if (Array.isArray(v)) return v.map(hienGiaTri).join(", ");
  return String(v);
}

function BangKhoa({ tieuDe, duLieu }: { tieuDe: string; duLieu: Record<string, unknown> }) {
  return (
    <div className="bao-cao-khoi">
      <p className="bao-cao-chi-muc">{tieuDe}</p>
      <table className="bao-cao-bang">
        <tbody>
          {Object.entries(duLieu).map(([khoa, gia]) => (
            <tr key={khoa}>
              <th scope="row">{NHAN_KHOA[khoa] ?? khoa}</th>
              <td>{hienGiaTri(gia)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function TrangInSoTay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const soId = Number(id);
  if (!Number.isInteger(soId)) notFound();

  const clientId = await docClientId();
  if (!clientId) notFound();

  const dong = await laySoTayTheoId(soId, clientId);
  if (!dong) notFound();

  const ngay = new Date(dong.taoLuc).toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" });

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 print:pt-0 sm:px-8">
      <style>{`
        .bao-cao-khoi { margin-top: 1.5rem; }
        .bao-cao-chi-muc {
          font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--color-shu-sang); margin-bottom: 0.5rem;
        }
        .bao-cao-bang { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .bao-cao-bang tr { border-bottom: 1px solid rgba(242,234,217,0.08); }
        .bao-cao-bang th, .bao-cao-bang td { padding: 0.5rem 0; text-align: left; }
        .bao-cao-bang th { color: var(--color-washi-mo); font-weight: 400; width: 60%; }
        .bao-cao-bang td { font-family: var(--font-mono); font-weight: 600; text-align: right; }
        @media print {
          :root, body { background: #fff !important; color: #111 !important; }
          .bao-cao-chi-muc { color: #b3401f !important; }
          .bao-cao-bang tr { border-bottom: 1px solid #ddd !important; }
          .bao-cao-bang th { color: #444 !important; }
          .bao-cao-bang td { color: #111 !important; }
          a { color: #111 !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="chi-muc mb-2 text-shu-sang">KAGAKU 科学 — Báo cáo thí nghiệm</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{dong.tieuDe}</h1>
          <p className="mt-2 text-sm text-washi-mo">
            {TEN_PHONG.get(dong.loaiPhong) ?? dong.loaiPhong} · lưu {ngay}
          </p>
        </div>
        <NutIn />
      </div>

      <div className="bao-cao-khoi">
        <p className="bao-cao-chi-muc">Công thức áp dụng</p>
        <p className="font-mono text-sm text-washi">{CONG_THUC_PHONG.get(dong.loaiPhong) ?? "—"}</p>
      </div>

      <BangKhoa tieuDe="Tham số đầu vào" duLieu={dong.thamSo as Record<string, unknown>} />
      <BangKhoa tieuDe="Kết quả" duLieu={dong.ketQua as Record<string, unknown>} />

      {dong.ghiChu && (
        <div className="bao-cao-khoi">
          <p className="bao-cao-chi-muc">Ghi chú</p>
          <p className="text-sm leading-relaxed text-washi">{dong.ghiChu}</p>
        </div>
      )}

      <p className="mt-10 text-[11px] leading-relaxed text-washi-mo/80">
        Số liệu hóa học dùng trong mô phỏng này (khối lượng mol, điểm nóng chảy/sôi…) đồng bộ từ{" "}
        <strong>{NGUON_DU_LIEU.ten}</strong> — {NGUON_DU_LIEU.nhaCungCap}. Công thức tính toán hiển thị đầy đủ
        trong từng phòng thí nghiệm tại kagaku — không dùng AI, không suy diễn số liệu.
      </p>
    </main>
  );
}
