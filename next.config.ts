import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Allow any local network device to access the dev server (IP changes per session)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
