import { handleDescribeRequest } from "@/server/identification/identify-request";

// POST /api/identify/description : description écrite (10 à 500 caractères, U35), identifiée par l'IA texte.
// 60 s couvrent 3 tentatives IA de 12 s (RG16).
export const runtime = "nodejs";
export const maxDuration = 60;

export function POST(request: Request): Promise<Response> {
  return handleDescribeRequest(request);
}
