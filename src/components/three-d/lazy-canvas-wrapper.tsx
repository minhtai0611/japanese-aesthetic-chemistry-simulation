"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * true from the moment the element first enters the viewport (the
 * `rootMargin` edge lets loading start a little before it's actually
 * scrolled into view) — then stays true even if it scrolls back out, since
 * once the 3D canvas has loaded there's no reason to tear it down again.
 * Environments without IntersectionObserver (SSR, old browsers) are treated
 * as already visible, so they're never permanently locked into 2D.
 */
export function useIntersectionObserver(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return { ref, isVisible };
}

/**
 * Wraps 3D content (three.js/@react-three/fiber): renders `render2D` by
 * default (static/SVG, no three.js chunk loaded), switching to `render3D`
 * only once the element enters the viewport OR the user clicks the activate
 * button (if `allowManualActivation`). `disable3D` (data saver mode, or a
 * device without WebGL support) turns the activation mechanism off entirely
 * — 2D stays permanent, with absolutely no path back to WebGL.
 */
export function LazyCanvasWrapper({
  disable3D,
  render2D,
  render3D,
  allowManualActivation = false,
  activateLabel = "Bật tương tác 3D xoay chiều",
  className = "absolute inset-0",
}: {
  disable3D: boolean;
  render2D: () => ReactNode;
  render3D: () => ReactNode;
  allowManualActivation?: boolean;
  activateLabel?: string;
  className?: string;
}) {
  const { ref, isVisible } = useIntersectionObserver();
  const [manuallyActivated, setManuallyActivated] = useState(false);
  const show3D = !disable3D && (isVisible || manuallyActivated);

  return (
    <div ref={ref} className={className}>
      {show3D ? render3D() : render2D()}
      {!disable3D && !show3D && allowManualActivation && (
        <button
          type="button"
          onClick={() => setManuallyActivated(true)}
          className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-washi/20 bg-sumi/70 px-4 py-2 text-xs text-washi-mo backdrop-blur transition-colors hover:border-shu-sang hover:text-washi"
        >
          {activateLabel}
        </button>
      )}
    </div>
  );
}
