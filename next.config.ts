import type { NextConfig } from "next";

// Security headers (Cybersecurity panel — P0)
// Tighten CSP progressively once auth + nonces land.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" }, // clickjacking defense
  { key: "X-Content-Type-Options", value: "nosniff" }, // MIME-sniffing defense
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Allow inline scripts/styles for Next.js + shadcn; tighten later with nonces.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://graph.facebook.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Removed `output: "standalone"` — Vercel doesn't need it; was conflicting with vercel-build.js
  // (Platform panel P2)
  typescript: {
    // Re-enabled — was masking real type bugs (Tech panel P1)
    ignoreBuildErrors: false,
  },
  reactStrictMode: true, // was false — was hiding effect bugs (Tech panel P1)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" }, // merchant-uploaded product images
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
