import { handleReportPost } from "@/server/reports/report-request";

// Signalement d'une identification erronée (U20) : proposition, correction, images seulement si consenti.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleReportPost(request);
}
