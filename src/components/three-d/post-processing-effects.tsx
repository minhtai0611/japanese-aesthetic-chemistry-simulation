"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Splits @react-three/postprocessing off from the main scene chunk (hero-scene.tsx/
 * compound-scene.tsx both dynamic-import themselves, but previously a static
 * import of postprocessing at the top of the file caused it to be bundled into
 * the SAME chunk, adding weight to the bundle that had to load/parse before the
 * first frame could be drawn). This file gets its own nested dynamic import and
 * only mounts after the main scene has already rendered (see `ready` at the
 * call site) — the post-processing (Bloom/Vignette) is an added aesthetic
 * effect, not primary content, so it can safely be deferred.
 */
export function HeroPostEffects() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.34} radius={0.75} />
      <Vignette eskil={false} offset={0.24} darkness={0.72} />
    </EffectComposer>
  );
}

export function CompoundPostEffects() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.24} luminanceSmoothing={0.4} radius={0.7} />
    </EffectComposer>
  );
}
