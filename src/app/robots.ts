import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

// robots.txt : tout le site public est indexable, sauf les routes d'API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
