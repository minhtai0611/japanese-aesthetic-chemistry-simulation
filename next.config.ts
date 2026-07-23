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
};

export default nextConfig;
