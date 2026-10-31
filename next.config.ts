import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages static export
  output: "export",
  // Repo is hosted at github.com/arihanntt/project → base path is /project
  basePath: "/project",
  assetPrefix: "/project/",
  // Allow large image processing in browser (no server-side image optimization needed)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
