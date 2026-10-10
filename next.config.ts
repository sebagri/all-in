import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // consente di caricare documenti fino a 20 MB sulle commesse
  experimental: { serverActions: { bodySizeLimit: "20mb" } },
};

export default nextConfig;
