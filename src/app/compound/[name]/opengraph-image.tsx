import { ImageResponse } from "next/og";
import { fetchCompoundByVariant } from "@/lib/pubchem";
import { lookupVariants } from "@/lib/substance-identification";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const { matchedKeyword: queryName, compound } = await fetchCompoundByVariant(lookupVariants(name));

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
          {compound?.formula ?? queryName}
        </span>
        <span style={{ fontSize: 28, color: "#cfc6b2", marginTop: 12, textTransform: "capitalize" }}>
          {queryName}
        </span>
        <div style={{ display: "flex", marginTop: 44, gap: 20 }}>
          {[
            compound?.molarMass != null ? `${compound.molarMass} g/mol` : null,
            compound ? `CID ${compound.cid}` : null,
          ]
            .filter((x): x is string => Boolean(x))
            .map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 9999,
                  border: "1px solid rgba(242,234,217,0.25)",
                  fontSize: 22,
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
