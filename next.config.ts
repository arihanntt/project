import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel-compatible config */
  output: "standalone",
  // Allow large image processing in browser (no server-side image optimization needed)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
