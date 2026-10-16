import { handleIdentifyRequest } from "@/server/identification/identify-request";

// POST /api/identify : 2 à 5 JPEG extraits dans le navigateur (champ « frames »), jamais de vidéo (invariant 1).
// sharp exige le runtime Node.js ; 60 s couvrent 3 tentatives IA de 12 s (RG16).
export const runtime = "nodejs";
export const maxDuration = 60;

export function POST(request: Request): Promise<Response> {
  return handleIdentifyRequest(request);
}
