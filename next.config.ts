import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mission pictures are named after their contents (see
    // scripts/import-images.ts), so a resized copy never goes out of date.
    // Keep copies for 31 days rather than the default 4 hours.
    minimumCacheTTL: 2678400,
  },
  // The map and mission pages read public/positions.json on the server to
  // know which journeys can be replayed (src/lib/routes.ts). Files in public
  // are served on their own, so they need adding to those pages' bundles.
  outputFileTracingIncludes: {
    "/map": ["./public/positions.json"],
    "/missions/*": ["./public/positions.json"],
  },
};

export default nextConfig;
