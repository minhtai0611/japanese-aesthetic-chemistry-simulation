/**
 * Phân tích công thức hoá học thành bảng đếm nguyên tố — đệ quy trên chuỗi,
 * cùng họ với electron-config.ts (không dùng thư viện ngoài, không AI).
 *
 *   "Ca(OH)2"     → { Ca: 1, O: 2, H: 2 }
 *   "Fe2(SO4)3"   → { Fe: 2, S: 3, O: 12 }
 *   "CuSO4·5H2O"  → { Cu: 1, S: 1, O: 9, H: 10 }   (dấu · hoặc . là ngậm nước)
 */
export function phanTichCongThuc(congThuc: string): Record<string, number> {
  const doan = congThuc.trim().split(/[·.]/);
  const tongHop: Record<string, number> = {};

  doan.forEach((phan, i) => {
    let vet = phan.trim();
    let heSoNgamNuoc = 1;
    if (i > 0) {
      const khop = vet.match(/^(\d+)(.*)$/);
      if (khop) {
        heSoNgamNuoc = Number(khop[1]);
        vet = khop[2];
      }
    }
    if (!vet) return;
    const con = phanTichDon(vet);
    for (const [nguyenTo, soLuong] of Object.entries(con)) {
      tongHop[nguyenTo] = (tongHop[nguyenTo] ?? 0) + soLuong * heSoNgamNuoc;
    }
  });

  return tongHop;
}

/** Phân tích một vế không có dấu ngậm nước — đệ quy trên dấu ngoặc đơn */
function phanTichDon(congThuc: string): Record<string, number> {
  let i = 0;

  function docSo(): number {
    let s = "";
    while (i < congThuc.length && /\d/.test(congThuc[i])) {
      s += congThuc[i];
      i++;
    }
    return s ? Number(s) : 1;
  }

  function docKyHieu(): string {
    let s = congThuc[i];
    i++;
    while (i < congThuc.length && /[a-z]/.test(congThuc[i])) {
      s += congThuc[i];
      i++;
    }
    return s;
  }

  function docNhom(): Record<string, number> {
    const ket: Record<string, number> = {};
    while (i < congThuc.length && congThuc[i] !== ")" && congThuc[i] !== "]") {
      if (congThuc[i] === "(" || congThuc[i] === "[") {
        const dong = congThuc[i] === "(" ? ")" : "]";
        i++;
        const con = docNhom();
        if (congThuc[i] !== dong) {
          throw new Error(`Thiếu dấu đóng ngoặc trong công thức "${congThuc}"`);
        }
        i++;
        const heSo = docSo();
        for (const [nguyenTo, soLuong] of Object.entries(con)) {
          ket[nguyenTo] = (ket[nguyenTo] ?? 0) + soLuong * heSo;
        }
      } else if (/[A-Z]/.test(congThuc[i])) {
        const nguyenTo = docKyHieu();
        const heSo = docSo();
        ket[nguyenTo] = (ket[nguyenTo] ?? 0) + heSo;
      } else {
        throw new Error(`Ký tự không hợp lệ '${congThuc[i]}' trong công thức "${congThuc}"`);
      }
    }
    return ket;
  }

  const ket = docNhom();
  if (i !== congThuc.length) {
    throw new Error(`Công thức dư ký tự sau vị trí ${i}: "${congThuc}"`);
  }
  return ket;
}
