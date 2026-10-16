import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

// Vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>` en temps constant.
// Sans secret configuré, la route d'erreur volontaire reste fermée.
export function isAuthorizedErrorCheck(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) {
    return false;
  }
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export class ErrorCheckError extends Error {
  constructor() {
    super("Erreur volontaire de vérification du suivi des erreurs (/api/health/error-check)");
    this.name = "ErrorCheckError";
  }
}
