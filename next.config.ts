import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site intentionally has no accounts. Old bookmarks to the removed auth
  // pages land straight on the downloader instead of a 404.
  async redirects() {
    return [
      { source: "/login", destination: "/downloader", permanent: false },
      { source: "/register", destination: "/downloader", permanent: false },
      { source: "/account", destination: "/downloader", permanent: false },
      { source: "/api/auth/:path*", destination: "/api/health", permanent: false },
    ];
  },
};

export default nextConfig;
