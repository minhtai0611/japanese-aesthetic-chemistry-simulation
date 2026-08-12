import { describe, it, expect } from "vitest";
import { electronShellConfig } from "@/lib/electron-config";
import fixture from "../fixtures/electron-config-118.json";

/**
 * A one-time snapshot fixture from real PubChem (pug/periodictable/JSON, a
 * single request returns all 118 elements — no per-element crawl needed),
 * captured 2026-07-29. Checked offline, no network dependency when running tests.
 */
// Raw fixture keys (kyHieu/cauHinhElectron) match the JSON captured verbatim from PubChem — not renamed.
type Row = { kyHieu: string; z: number; cauHinhElectron: string };
const DATA = fixture as Row[];

describe("electronShellConfig — scan all 118 elements (real PubChem data)", () => {
  it("has exactly 118 elements in the fixture", () => {
    expect(DATA).toHaveLength(118);
  });

  const bySymbol = new Map(DATA.map((d) => [d.kyHieu, { electronConfig: d.cauHinhElectron }]));

  it.each(DATA.map((d) => [d.kyHieu, d.z, d.cauHinhElectron] as const))(
    "%s (Z=%i): total shell electrons == Z",
    (_symbol, z, electronConfig) => {
      const shells = electronShellConfig(electronConfig, bySymbol);
      expect(shells.reduce((a, b) => a + b, 0)).toBe(z);
    },
  );
});
