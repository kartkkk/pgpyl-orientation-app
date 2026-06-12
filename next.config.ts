import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Allow Turbopack in dev (Serwist only runs in production build)
  turbopack: {},
  // Allow any local network device to access the dev server (IP changes per session)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

// Only apply Serwist in production — it uses webpack and doesn't support Turbopack
async function getConfig(): Promise<NextConfig> {
  if (isDev) return nextConfig;

  const withSerwistInit = (await import("@serwist/next")).default;
  const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
  });
  return withSerwist(nextConfig);
}

export default getConfig();
