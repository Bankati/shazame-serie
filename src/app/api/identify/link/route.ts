import { handleLinkRequest } from "@/server/identification/identify-request";

// POST /api/identify/link : lien YouTube ou TikTok (U36). Métadonnées publiques seulement, jamais la vidéo.
// sharp (vignette) exige le runtime Node.js ; 60 s couvrent les appels des plateformes et 3 tentatives IA (RG16).
export const runtime = "nodejs";
export const maxDuration = 60;

export function POST(request: Request): Promise<Response> {
  return handleLinkRequest(request);
}
