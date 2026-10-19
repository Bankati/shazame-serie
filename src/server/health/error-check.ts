import "server-only";

import { isAuthorizedCron } from "@/server/http/cron-auth";

// Vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>` en temps constant (même règle que les crons).
// Sans secret configuré, la route d'erreur volontaire reste fermée.
export function isAuthorizedErrorCheck(authorization: string | null, secret: string | undefined): boolean {
  return isAuthorizedCron(authorization, secret);
}

export class ErrorCheckError extends Error {
  constructor() {
    super("Erreur volontaire de vérification du suivi des erreurs (/api/health/error-check)");
    this.name = "ErrorCheckError";
  }
}
