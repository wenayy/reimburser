import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // camera photos (bill scans, payment proofs) easily exceed the 1MB
      // default; the client also downscales before upload, this is headroom
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        // legacy vercel.app aliases → the real domain, permanently.
        // (exact hosts only — preview deployment URLs keep working for testing)
        source: "/:path*",
        has: [
          {
            type: "host",
            value:
              "(reimburser-gules|reimburser-infin|reimburser-uknowilvuladies143-7139-infin)\\.vercel\\.app",
          },
        ],
        destination: "https://reimburser.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // no page here has a reason to be framed — blocks clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
