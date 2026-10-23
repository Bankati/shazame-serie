import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";
import { listIdentifiedTitlePaths } from "@/server/catalog/sitemap-titles";

// sitemap.xml : accueil et fiches des titres déjà identifiés (U15), régénéré chaque jour.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const titles = await listIdentifiedTitlePaths();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/identifier`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tarifs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/calendrier`, changeFrequency: "daily", priority: 0.8 },
    ...titles.map((title) => ({ url: `${base}${title.path}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
