import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? (process.env.VERCEL ? ".next" : ".next-verify"),
};

export default nextConfig;
