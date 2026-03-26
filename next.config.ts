import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages; Vercel uses server mode
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/tagtoo-pdf-edit",
        assetPrefix: "/tagtoo-pdf-edit/",
      }
    : {}),
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
