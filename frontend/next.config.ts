import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any HTTPS source during development.
  // Tighten this list in production to known avatar/asset hosts.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Forward API requests to the FastAPI backend in development.
  // In production, NEXT_PUBLIC_API_URL is set to the deployed backend URL.
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
