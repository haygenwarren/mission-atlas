import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mission pictures are named after their contents (see
    // scripts/import-images.ts), so a resized copy never goes out of date.
    // Keep copies for 31 days rather than the default 4 hours.
    minimumCacheTTL: 2678400,
  },
  // The map and mission pages read public/positions.json and
  // public/local/index.json on the server to know which journeys can be
  // replayed (src/lib/routes.ts). Files in public are served on their own,
  // so they need adding to those pages' bundles.
  outputFileTracingIncludes: {
    "/map": ["./public/positions.json", "./public/local/index.json"],
    "/missions/*": ["./public/positions.json", "./public/local/index.json"],
  },
  // The site lives at mission-atlas.net. Its first address, from before the
  // domain, sends visitors and search engines there, keeping the path.
  // Preview deployments have their own addresses and are unaffected.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mission-atlas-delta.vercel.app" }],
        destination: "https://mission-atlas.net/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
