import { handleCatalogSearch } from "@/server/catalog/search-request";

// Recherche d'un titre (fenêtre de signalement, U20).
export const runtime = "nodejs";

export function GET(request: Request): Promise<Response> {
  return handleCatalogSearch(request);
}
