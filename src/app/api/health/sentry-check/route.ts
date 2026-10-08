import { env } from "@/server/env";
import { isAuthorizedSentryCheck, SentryCheckError } from "@/server/health/sentry-check";
import { jsonError } from "@/server/http/respond";

// Erreur volontaire pour vérifier que Sentry reçoit les erreurs d'un environnement déployé.
// Protégée par CRON_SECRET (docs/setup-deploiement.md).
export function GET(request: Request): Response {
  if (!isAuthorizedSentryCheck(request.headers.get("authorization"), env.CRON_SECRET)) {
    return jsonError("UNAUTHENTICATED");
  }
  throw new SentryCheckError();
}
