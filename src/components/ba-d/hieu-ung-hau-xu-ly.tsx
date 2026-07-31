"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Tách riêng @react-three/postprocessing khỏi chunk cảnh chính (canh-hero.tsx/
 * canh-hop-chat.tsx đều dynamic-import chính chúng, nhưng trước đây import
 * tĩnh postprocessing ở đầu file khiến nó bị đóng gói CHUNG chunk, nặng thêm
 * bundle phải tải/parse trước khi có thể vẽ khung hình đầu tiên). File này
 * được nested dynamic-import riêng và chỉ mount sau khi scene chính đã render
 * xong (xem `daSanSang` ở nơi gọi) — hậu xử lý (Bloom/Vignette) là hiệu ứng
 * thẩm mỹ thêm vào, không phải nội dung chính, nên trì hoãn được an toàn.
 */
export function HieuUngHero() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.34} radius={0.75} />
      <Vignette eskil={false} offset={0.24} darkness={0.72} />
    </EffectComposer>
  );
}

export function HieuUngHopChat() {
  return (
    <EffectComposer>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.24} luminanceSmoothing={0.4} radius={0.7} />
    </EffectComposer>
  );
}
