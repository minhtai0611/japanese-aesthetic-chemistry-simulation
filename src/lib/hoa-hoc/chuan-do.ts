/** pH dung dịch axit mạnh–bazơ mạnh từ số mol & Kw = 1e-14 (25 °C) — toán thuần, không suy diễn */
export function pHChuanDo(Ca: number, Va: number, Cb: number, Vb: number): number {
  const molH = Ca * Va; // mmol H⁺
  const molOH = Cb * Vb; // mmol OH⁻
  const tong = Va + Vb; // mL  (mmol/mL === mol/L)
  const du = molH - molOH;
  if (Math.abs(du) / tong < 1e-9) return 7;
  if (du > 0) return -Math.log10(du / tong);
  return 14 + Math.log10(-du / tong);
}

/** Thể tích bazơ cần để trung hòa hết axit mạnh ban đầu */
export function theTichTuongDuong(Ca: number, Va: number, Cb: number): number {
  return (Ca * Va) / Cb;
}

/**
 * Có đang ở điểm tương đương không?
 *
 * Cửa sổ ±0,5% thể tích tương đương — đủ hẹp để pH hiển thị không mâu thuẫn nhãn.
 * Cửa sổ cũ (±vToiDa/120, ≈ ±2% Veq trong dải slider mặc định) rộng tới mức ở
 * Vb lệch 0,1–0,4 mL so với điểm tương đương, nhãn vẫn ghi "pH = 7" trong khi
 * pH thực đã tụt xuống 3,0–3,7 — mâu thuẫn hiển thị ngay trên màn hình dạy học.
 */
export function laDiemTuongDuong(ca: number, va: number, cb: number, vb: number): boolean {
  const veq = theTichTuongDuong(ca, va, cb);
  return Math.abs(vb - veq) <= veq * 0.005;
}
