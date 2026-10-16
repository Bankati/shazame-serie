import { handleQuotaRequest } from "@/server/identification/identify-request";

// GET /api/quota : identifications restantes aujourd'hui et prochaine remise à zéro (compteur de quota).
export const runtime = "nodejs";

export function GET(): Promise<Response> {
  return handleQuotaRequest();
}
