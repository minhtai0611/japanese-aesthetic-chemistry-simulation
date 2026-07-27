/** Khoảng cách chỉnh sửa Levenshtein cổ điển — thuật toán quy hoạch động, không AI. */
export function khoangCachLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let hangTruoc = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const hangHienTai = [i];
    for (let j = 1; j <= n; j++) {
      const chiPhi = a[i - 1] === b[j - 1] ? 0 : 1;
      hangHienTai[j] = Math.min(
        hangTruoc[j] + 1,
        hangHienTai[j - 1] + 1,
        hangTruoc[j - 1] + chiPhi,
      );
    }
    hangTruoc = hangHienTai;
  }
  return hangTruoc[n];
}

/** Tìm tối đa `gioiHan` mục gần đúng nhất trong `taiLieu` so với `tuKhoa`, theo khoảng cách Levenshtein. */
export function goiYGanDung(tuKhoa: string, taiLieu: readonly string[], gioiHan = 4): string[] {
  const t = tuKhoa.trim().toLowerCase();
  if (!t) return [];
  return [...taiLieu]
    .map((muc) => ({ muc, khoangCach: khoangCachLevenshtein(t, muc.toLowerCase()) }))
    .filter(({ khoangCach, muc }) => khoangCach <= Math.max(3, Math.floor(muc.length * 0.4)))
    .sort((a, b) => a.khoangCach - b.khoangCach)
    .slice(0, gioiHan)
    .map(({ muc }) => muc);
}
