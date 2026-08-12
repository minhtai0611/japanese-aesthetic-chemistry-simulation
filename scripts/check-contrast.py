#!/usr/bin/env python3
"""
Kiểm tra độ tương phản WCAG 2.2 cho các cặp màu chữ/nền thật sự xuất hiện
trên trang — đọc trực tiếp từ src/app/globals.css (@theme) và
src/lib/element.ts (MAU_KHOI), không chép tay giá trị hex để tránh
script và code lệch nhau theo thời gian.

Ngưỡng WCAG AA: văn bản thường >= 4.5:1, văn bản lớn (>=18pt hoặc
>=14pt in đậm) hoặc thành phần UI >= 3:1.
"""

import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
GLOBALS_CSS = GOC / "src" / "app" / "globals.css"
NGUYEN_TO_TS = GOC / "src" / "lib" / "element.ts"


def hex_sang_rgb(ma: str) -> tuple[int, int, int]:
    ma = ma.lstrip("#")
    if len(ma) == 3:
        ma = "".join(c * 2 for c in ma)
    return tuple(int(ma[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def do_sang_tuong_doi(rgb: tuple[int, int, int]) -> float:
    def kenh(c: int) -> float:
        s = c / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4

    r, g, b = (kenh(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ty_le_tuong_phan(mau_a: str, mau_b: str) -> float:
    la = do_sang_tuong_doi(hex_sang_rgb(mau_a))
    lb = do_sang_tuong_doi(hex_sang_rgb(mau_b))
    sang, toi = max(la, lb), min(la, lb)
    return (sang + 0.05) / (toi + 0.05)


def doc_bien_theme() -> dict[str, str]:
    van = GLOBALS_CSS.read_text(encoding="utf-8")
    return dict(re.findall(r"--color-([\w-]+):\s*(#[0-9a-fA-F]{3,6});", van))


def doc_mau_khoi() -> dict[str, str]:
    van = NGUYEN_TO_TS.read_text(encoding="utf-8")
    khoi_khop = re.search(r"MAU_KHOI[^{]*\{([^}]*)\}", van)
    if not khoi_khop:
        return {}
    return dict(re.findall(r"(\w+):\s*\"(#[0-9a-fA-F]{3,6})\"", khoi_khop.group(1)))


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    bien = doc_bien_theme()
    khoi = doc_mau_khoi()

    sumi = bien["sumi"]
    sumi_nhat = bien["sumi-nhat"]

    # (nhãn, màu chữ, màu nền, ngưỡng yêu cầu)
    CAC_CAP: list[tuple[str, str, str, float]] = [
        ("Chữ chính (washi) trên nền sumi", bien["washi"], sumi, 4.5),
        ("Chữ phụ (washi-mo) trên nền sumi", bien["washi-mo"], sumi, 4.5),
        ("Liên kết/nhấn (shu-sang) trên nền sumi", bien["shu-sang"], sumi, 3.0),
        ("Vàng kim (kin) trên nền sumi", bien["kin"], sumi, 3.0),
        ("Nút CTA: trắng trên nền shu (.nut-chu)", "#ffffff", bien["shu"], 4.5),
        ("Khối s (MAU_KHOI.s) trên nền sumi-nhat", khoi["s"], sumi_nhat, 4.5),
        ("Khối p (MAU_KHOI.p) trên nền sumi-nhat", khoi["p"], sumi_nhat, 4.5),
        ("Khối d (MAU_KHOI.d) trên nền sumi-nhat", khoi["d"], sumi_nhat, 4.5),
        ("Khối f (MAU_KHOI.f) trên nền sumi-nhat", khoi["f"], sumi_nhat, 4.5),
    ]

    rong = max(len(nhan) for nhan, *_ in CAC_CAP)
    so_fail = 0
    for nhan, chu, nen, nguong in CAC_CAP:
        ty_le = ty_le_tuong_phan(chu, nen)
        dat = ty_le >= nguong
        if not dat:
            so_fail += 1
        trang_thai = "PASS" if dat else "FAIL"
        print(f"{nhan:<{rong}}  {chu:>8} / {nen:<8}  {ty_le:5.2f}:1  (>= {nguong:.1f})  {trang_thai}")

    print()
    if so_fail:
        print(f"❌ {so_fail} cặp KHÔNG đạt WCAG AA")
        return 1
    print(f"✅ Cả {len(CAC_CAP)} cặp đều đạt WCAG AA")
    return 0


if __name__ == "__main__":
    sys.exit(main())
