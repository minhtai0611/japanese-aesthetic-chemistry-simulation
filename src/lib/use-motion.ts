"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "kagaku-reduced-motion"; // "1" | "0" | absent = follow the OS setting
const EVENT = "kagaku-reduced-motion-change";

const mql = () => (typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)"));

function readOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "1" ? true : v === "0" ? false : null;
}

/**
 * Has the user asked for reduced motion? Prioritizes an explicit in-UI
 * choice (a button in the menu — not everyone knows how to enable it at
 * the OS level), stored in localStorage; if never toggled, falls back to
 * the OS/browser default.
 *
 * DIFFERENT from CSS @media (prefers-reduced-motion): CSS animation-duration
 * can't reach three.js's requestAnimationFrame/useFrame — this hook reads
 * directly via useSyncExternalStore, allowing the render loop to be FULLY
 * STOPPED (Canvas frameloop="demand", manually canceling
 * requestAnimationFrame…) rather than just disabling CSS animation.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const m = mql();
      m?.addEventListener("change", notify);
      window.addEventListener(EVENT, notify);
      window.addEventListener("storage", notify);
      return () => {
        m?.removeEventListener("change", notify);
        window.removeEventListener(EVENT, notify);
        window.removeEventListener("storage", notify);
      };
    },
    () => readOverride() ?? mql()?.matches ?? false,
    () => false,
  );
}

/** Manually overrides the reduced-motion choice — used by the on/off toggle button shown in the UI. */
export function useSetReducedMotionManual(): (enabled: boolean) => void {
  return useCallback((enabled: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  }, []);
}
