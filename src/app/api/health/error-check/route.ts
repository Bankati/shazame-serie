import { env } from "@/server/env";
import { ErrorCheckError, isAuthorizedErrorCheck } from "@/server/health/error-check";
import { jsonError } from "@/server/http/respond";

// Erreur volontaire pour vérifier que PostHog reçoit les erreurs d'un environnement déployé
// (remontée par onRequestError, instrumentation.ts). Protégée par CRON_SECRET (docs/setup-deploiement.md).
export function GET(request: Request): Response {
  if (!isAuthorizedErrorCheck(request.headers.get("authorization"), env.CRON_SECRET)) {
    return jsonError("UNAUTHENTICATED");
  }
  throw new ErrorCheckError();
}
