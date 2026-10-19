import { handlePurgeRequest } from "@/server/history/purge-request";

// Purge quotidienne des identifications de plus de 2 ans (RG11), déclenchée par Vercel Cron (vercel.json).
export const runtime = "nodejs";
export const maxDuration = 60;

export function GET(request: Request): Promise<Response> {
  return handlePurgeRequest(request);
}
