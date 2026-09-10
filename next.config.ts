import type { NextConfig } from "next";
const development = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
  // Next streams inline bootstrap scripts; maps use inline positioning styles.
  // A nonce-only policy would change static rendering/caching and is a separate migration.
  `script-src 'self' 'unsafe-inline' ${development ? "'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self' data:",
  `connect-src 'self' https://vitals.vercel-insights.com ${development ? "ws://localhost:* ws://127.0.0.1:*" : ""}`
].join('; ');
const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [],
    localPatterns: [{ pathname: '/images/**', search: '' }],
    maximumResponseBody: 10 * 1024 * 1024,
    maximumDiskCacheSize: 100 * 1024 * 1024,
    formats: ['image/webp']
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  }
};
export default nextConfig;
