import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable serverExternalPackages for compatibility (moved from experimental)
  serverExternalPackages: ["mongoose", "adm-zip"],
  // Handle file uploads
  webpack: (config: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
