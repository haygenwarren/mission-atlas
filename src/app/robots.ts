import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Search engines may visit every page, and are pointed to the sitemap.
// Until launch, each page still asks not to be listed (see the layout).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
