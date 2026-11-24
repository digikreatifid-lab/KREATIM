import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/WASM renderers must stay as runtime requires, not bundled.
  serverExternalPackages: ["@resvg/resvg-js", "satori"],
  // Satori reads font files from disk at runtime; make sure they ship with the server build.
  outputFileTracingIncludes: {
    "/api/agents/design/**": ["./assets/fonts/**"],
  },
};

export default nextConfig;
