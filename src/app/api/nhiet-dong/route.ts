import { NextResponse } from "next/server";
import { tinhNhietDongPhanUng } from "@/lib/hoa-hoc/nhiet-dong";
import { phanTichCongThuc } from "@/lib/hoa-hoc/parser-cong-thuc";

export const dynamic = "force-dynamic";

interface YeuCau {
  tenTrai: string[];
  heSoTrai: number[];
  tenPhai: string[];
  heSoPhai: number[];
}

/**
 * Server-only: tra nhiệt động lực học (PubChem + Materials Project, xem
 * nhiet-dong.ts) cho một phương trình ĐÃ CÂN BẰNG. Phải là route riêng —
 * KHÔNG gọi trực tiếp từ "use client" component, vì nhiet-dong.ts (qua
 * pubchem.ts) đụng tới `pg`/Node-only modules và MATERIALS_PROJECT_API_KEY
 * KHÔNG được lộ ra bundle client.
 */
export async function POST(yeu: Request) {
  let body: YeuCau;
  try {
    body = await yeu.json();
  } catch {
    return NextResponse.json({ loi: "JSON không hợp lệ." }, { status: 400 });
  }

  const { tenTrai, heSoTrai, tenPhai, heSoPhai } = body;
  if (
    !Array.isArray(tenTrai) || !Array.isArray(heSoTrai) || !Array.isArray(tenPhai) || !Array.isArray(heSoPhai) ||
    tenTrai.length !== heSoTrai.length || tenPhai.length !== heSoPhai.length
  ) {
    return NextResponse.json({ loi: "Thiếu hoặc sai hình dạng tenTrai/heSoTrai/tenPhai/heSoPhai." }, { status: 400 });
  }

  try {
    const bangTrai = tenTrai.map(phanTichCongThuc);
    const bangPhai = tenPhai.map(phanTichCongThuc);
    const ketQua = await tinhNhietDongPhanUng(tenTrai, bangTrai, heSoTrai, tenPhai, bangPhai, heSoPhai);
    return NextResponse.json(ketQua);
  } catch (e) {
    console.error("[nhiet-dong] Lỗi tính nhiệt động:", e instanceof Error ? e.message : e);
    return NextResponse.json({ coDuLieu: false, thieuChat: [...tenTrai, ...tenPhai] });
  }
}
