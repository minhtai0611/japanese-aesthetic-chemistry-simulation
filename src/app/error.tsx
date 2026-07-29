"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[kagaku]", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="chu-doc mx-auto mb-6 text-sm text-washi/40" lang="ja">
        失敗
      </p>
      <h1 className="font-display text-3xl font-bold text-washi">Thí nghiệm gặp trục trặc</h1>
      <p className="mt-4 leading-relaxed text-washi-mo">
        Máy chủ dữ liệu PubChem có thể đang bận. Bạn thử lại sau ít phút nhé.
      </p>
      <button onClick={reset} className="nut-chu mt-8 rounded-full bg-shu px-7 py-3.5 font-semibold">
        Thử lại
      </button>
    </main>
  );
}
