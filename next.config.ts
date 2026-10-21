import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mission pictures are named after their contents (see
    // scripts/import-images.ts), so a resized copy never goes out of date.
    // Keep copies for 31 days rather than the default 4 hours.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
