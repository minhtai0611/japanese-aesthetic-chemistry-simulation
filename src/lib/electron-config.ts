/**
 * Expands a noble-gas-abbreviated electron configuration, e.g. "[Rn] 5f14 6d10 7s2 7p2".
 *
 * PubChem returns electron configurations in nested form: each element
 * references the nearest noble gas ("[Xe]", "[Rn]"…), and that noble gas
 * itself is represented via the noble gas before it ("[Xe]" = "[Kr] 4d10
 * 5s2 5p6"). The longest noble-gas nesting chain in the periodic table
 * (Og, Z=118) goes through Rn → Xe → Kr → Ar → Ne → He — 5 substitution
 * passes. The original code capped recursion at 4 passes, so all 32
 * elements with a [Rn] core (Z 87–118) collapsed to an empty shell.
 */
export function electronShellConfig(config: string, bySymbol: Map<string, { electronConfig: string }>): number[] {
  const shells = new Array<number>(7).fill(0);
  if (!config) return shells.filter((x) => x > 0);

  let cfg = config;
  // Loop cap set generously above the real max nesting depth (5) as a safety margin for future data.
  for (let loopIndex = 0; loopIndex < 12 && cfg.includes("["); loopIndex++) {
    const previous = cfg;
    cfg = cfg.replace(/\[([A-Za-z]{1,2})\]/g, (_match, symbol: string) => {
      const entry = bySymbol.get(symbol);
      return entry?.electronConfig ? ` ${entry.electronConfig} ` : "";
    });
    if (cfg === previous) break; // symbol couldn't be resolved (unexpected data) — avoid an endless loop
  }

  const pattern = /(\d)([spdf])(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(cfg))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 7) shells[n - 1] += Number(m[3]);
  }
  return shells.filter((x) => x > 0);
}
