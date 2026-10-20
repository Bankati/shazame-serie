import { handleDeepHealth } from "@/server/health/deep-check";

// Vérification approfondie d'un déploiement : base, Redis, stockage (Authorization: Bearer CRON_SECRET).
export const runtime = "nodejs";

export function GET(request: Request): Promise<Response> {
  return handleDeepHealth(request);
}
