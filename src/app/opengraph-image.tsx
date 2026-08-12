import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} ${SITE.kanji} — Phòng thí nghiệm hóa học ảo`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#0b0a08",
          backgroundImage:
            "radial-gradient(ellipse at 82% 18%, rgba(214,59,31,0.28), transparent 60%), radial-gradient(ellipse at 12% 92%, rgba(201,163,90,0.18), transparent 55%)",
          color: "#f2ead9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 9999,
              border: "3px solid #ff5b36",
              color: "#f2ead9",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            科
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6 }}>KAGAKU</span>
            <span style={{ fontSize: 18, color: "#cfc6b2", letterSpacing: 4 }}>科学 · PHÒNG THÍ NGHIỆM HÓA HỌC SỐ</span>
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 56, maxWidth: 980 }}>
          <span style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.15 }}>
            Bảng tuần hoàn, hợp chất 3D và phòng thí nghiệm ảo — dữ liệu mở PubChem
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 48, gap: 20 }}>
          {["118 nguyên tố", "Hợp chất 3D", "PubChem PUG-REST"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 9999,
                border: "1px solid rgba(242,234,217,0.25)",
                fontSize: 22,
                color: "#c9a35a",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
