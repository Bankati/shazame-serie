import "server-only";

import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { isAuthorizedCron } from "@/server/http/cron-auth";
import { jsonError, jsonOk } from "@/server/http/respond";
import { log } from "@/server/log";

import { purgeOldIdentifications } from "./history";

// GET /api/cron/purge-identifications (Vercel Cron, chaque jour) : RG11, historique conservé 2 ans.
export async function handlePurgeRequest(request: Request, purge = () => purgeOldIdentifications(getDb())): Promise<Response> {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return jsonError("UNAUTHENTICATED");
  }
  try {
    const deleted = await purge();
    log.info("history.purged", { deleted });
    return jsonOk({ deleted });
  } catch {
    log.error("history.purge_failed");
    return jsonError("INTERNAL_ERROR");
  }
}
