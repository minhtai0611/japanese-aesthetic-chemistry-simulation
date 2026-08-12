import type { NextConfig } from "next";

/**
 * CSP không dùng nonce: toàn bộ script/style của Next.js (hydration payload,
 * Tailwind + style={{}} inline) cần 'unsafe-inline'. Đổi sang nonce theo request
 * (qua middleware) sẽ chặt hơn nhưng cần hạ tầng riêng — để lại cho một đợt sau.
 *
 * `vercel.live` được whitelist riêng vì Vercel tự tiêm script/toolbar phản hồi
 * (feedback/comments) trên preview deployment — không whitelist thì CSP chặn
 * luôn cả toolbar của chính Vercel, không liên quan gì tới code của app.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  "font-src 'self' data: https://vercel.live",
  "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com",
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  // Đổi tên route Việt hóa sang tiếng Anh (Phase A) — giữ mọi URL cũ đã lập
  // chỉ mục/chia sẻ hoạt động vĩnh viễn qua 308, thay vì để 404.
  async redirects() {
    return [
      { source: "/hop-chat", destination: "/compound", permanent: true },
      { source: "/hop-chat/:ten", destination: "/compound/:ten", permanent: true },
      { source: "/nguyen-to/:kyhieu", destination: "/element/:kyhieu", permanent: true },
      { source: "/bang-tuan-hoan", destination: "/periodic-table", permanent: true },
      { source: "/thi-nghiem", destination: "/experiments", permanent: true },
      { source: "/thi-nghiem/pha-che", destination: "/experiments/preparation", permanent: true },
      { source: "/thi-nghiem/chuan-do", destination: "/experiments/titration", permanent: true },
      { source: "/thi-nghiem/chuyen-pha", destination: "/experiments/phase-change", permanent: true },
      { source: "/thi-nghiem/can-bang", destination: "/experiments/equilibrium", permanent: true },
      { source: "/thi-nghiem/pin-dien-hoa", destination: "/experiments/electrochemical-cell", permanent: true },
      { source: "/quan-tri/tu-khoa-thieu", destination: "/admin/missing-keywords", permanent: true },
    ];
  },
};

export default nextConfig;
