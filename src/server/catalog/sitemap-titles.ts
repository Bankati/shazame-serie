import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { titlePath } from "@/lib/title-url";
import { getDb, withQueryTimeout } from "@/server/db/client";
import { resultCache } from "@/server/db/schema";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";

import { getStaticPageCatalog } from "./tmdb/tmdb-catalog";

// Titres déjà identifiés, pour le sitemap (U15) : entrées du cache de résultats encore actives, les plus vues
// d'abord. Les titres sont relus via le catalogue (mis en cache par Next avec le sitemap) pour l'adresse canonique.
const MAX_TITLES = 200;
const CONCURRENCY = 8;

export type SitemapTitle = { path: string };

export async function listIdentifiedTitlePaths(): Promise<SitemapTitle[]> {
  try {
    const rows = await withQueryTimeout(getDb(), (tx) =>
      tx
        .selectDistinct({ tmdbId: resultCache.tmdbId, mediaType: resultCache.mediaType, hits: resultCache.hits })
        .from(resultCache)
        .where(and(eq(resultCache.disabled, false)))
        .orderBy(desc(resultCache.hits))
        .limit(MAX_TITLES),
    );

    const catalog = getStaticPageCatalog();
    const paths: SitemapTitle[] = [];
    for (let index = 0; index < rows.length; index += CONCURRENCY) {
      const batch = await Promise.all(
        rows.slice(index, index + CONCURRENCY).map(async (row) => {
          const details = await catalog.getTitleDetails(row.tmdbId, row.mediaType).catch(() => null);
          return details ? { path: titlePath(details.mediaType, details.tmdbId, details.title) } : null;
        }),
      );
      paths.push(...batch.filter((entry): entry is SitemapTitle => entry !== null));
    }
    return [...new Map(paths.map((entry) => [entry.path, entry])).values()];
  } catch (error) {
    // Erreurs internes de Next (rendu dynamique, redirection) : jamais absorbées.
    if (isNextInternalError(error)) {
      throw error;
    }
    // Base ou TMDB indisponible (CI, panne) : le sitemap garde au moins l'accueil.
    log.warn("sitemap.titles_unavailable", { code: errorCode(error) });
    return [];
  }
}

function isNextInternalError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string" && /^(DYNAMIC_SERVER_USAGE|NEXT_)/.test(error.digest);
}
