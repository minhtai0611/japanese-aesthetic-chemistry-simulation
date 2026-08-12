"use client";

import { useCallback, useSyncExternalStore } from "react";
import { BatteryCharging } from "lucide-react";

const STORAGE_KEY = "kagaku-tiet-kiem";
const CHANGE_EVENT = "kagaku-tiet-kiem-doi";

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

/**
 * Data saver mode: disables the 3D hero, disables postprocessing, reduces
 * the number of simulated particles. Persisted to localStorage and paired
 * with a custom event so every open component (in the same tab) updates
 * immediately — the browser's native "storage" event only fires in OTHER
 * tabs, never in the tab that just wrote the value.
 */
export function useDataSaverMode(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(
    (notify) => {
      window.addEventListener(CHANGE_EVENT, notify);
      window.addEventListener("storage", notify);
      return () => {
        window.removeEventListener(CHANGE_EVENT, notify);
        window.removeEventListener("storage", notify);
      };
    },
    readStoredPreference,
    () => false,
  );

  const setEnabled = useCallback((v: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [enabled, setEnabled];
}

export default function DataSaverModeButton({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useDataSaverMode();
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      title="Chế độ tiết kiệm: tắt nền 3D, giảm số hạt mô phỏng — phù hợp máy yếu hoặc mạng chậm"
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
        enabled
          ? "border-tokiwa/50 bg-tokiwa/15 text-tokiwa"
          : "border-washi/15 text-washi-mo hover:border-washi/40 hover:text-washi"
      } ${className}`}
    >
      <BatteryCharging size={14} />
      {enabled ? "Đang tiết kiệm" : "Tiết kiệm"}
    </button>
  );
}
