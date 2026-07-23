import { ImageResponse } from "next/og";
import { layHopChat } from "@/lib/pubchem";
import { boSlugHopChat } from "@/lib/slug";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ ten: string }> }) {
  const { ten } = await params;
  const tenTruyVan = boSlugHopChat(ten);
  const hopChat = await layHopChat(tenTruyVan);

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
        <span style={{ fontSize: 22, letterSpacing: 4, color: "#c9a35a" }}>KAGAKU · 分子観測台</span>
        <span style={{ fontSize: 64, fontWeight: 800, marginTop: 28, textTransform: "capitalize" }}>
          {hopChat?.congThuc ?? tenTruyVan}
        </span>
        <span style={{ fontSize: 28, color: "#cfc6b2", marginTop: 12, textTransform: "capitalize" }}>
          {tenTruyVan}
        </span>
        <div style={{ display: "flex", marginTop: 44, gap: 20 }}>
          {[
            hopChat?.khoiLuongMol != null ? `${hopChat.khoiLuongMol} g/mol` : null,
            hopChat ? `CID ${hopChat.cid}` : null,
          ]
            .filter((x): x is string => Boolean(x))
            .map((nhan) => (
              <div
                key={nhan}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 9999,
                  border: "1px solid rgba(242,234,217,0.25)",
                  fontSize: 22,
                }}
              >
                {nhan}
              </div>
            ))}
        </div>
      </div>
    ),
    size,
  );
}
