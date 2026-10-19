import { getWatchProvider } from "@/server/catalog/watch/tmdb-watch-providers";
import { handleWatchRequest } from "@/server/catalog/watch/watch-request";

// GET /api/titles/{movie|tv}/{id}/watch : où regarder ce titre dans le pays du visiteur (U16).
export const runtime = "nodejs";

export async function GET(request: Request, { params }: RouteContext<"/api/titles/[mediaType]/[id]/watch">): Promise<Response> {
  return handleWatchRequest(request, await params, getWatchProvider);
}
