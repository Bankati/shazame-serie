import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

// Routes appelées par Vercel Cron (et la route d'erreur volontaire) : en-tête `Authorization: Bearer
// <CRON_SECRET>` vérifié en temps constant. Sans secret configuré, la route reste fermée.
export function isAuthorizedCron(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) {
    return false;
  }
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}
