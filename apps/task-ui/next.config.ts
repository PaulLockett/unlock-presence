import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@presence-os/schemas", "@presence-os/auth"],
};

export default nextConfig;
