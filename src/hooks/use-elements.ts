"use client";

import { useEffect, useState } from "react";
import type { ElementInfo } from "@/lib/pubchem";

/**
 * Fetches the periodic table from /api/elements into state, client-side —
 * used by experiment labs that need atomic data (molar mass, electrode
 * potentials) without importing pubchem.ts directly (it touches Postgres,
 * Node-only, must not leak into the "use client" bundle).
 */
export function useElements(): ElementInfo[] | null {
  const [elements, setElements] = useState<ElementInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/elements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ElementInfo[] | null) => {
        if (!cancelled && d) setElements(d);
      })
      .catch(() => {
        /* Caller treats a missing element table as "fine, feature degrades" */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return elements;
}
