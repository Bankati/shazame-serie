import "server-only";

import { sql } from "drizzle-orm";

import { getRedis } from "@/server/cache/redis";
import { getDb, withQueryTimeout } from "@/server/db/client";
import { env } from "@/server/env";
import { isAuthorizedCron } from "@/server/http/cron-auth";
import { jsonError, jsonOk } from "@/server/http/respond";
import { errorCode } from "@/server/log-error";
import { getStorageAdmin } from "@/server/storage/admin-client";

// GET /api/health/deep (protégée par CRON_SECRET) : vérifie en un appel la base, Redis et le stockage d'un
// déploiement. Ajoutée le 20 octobre 2026 : une DATABASE_URL au mot de passe périmé faisait échouer en
// silence tout ce qui touche la base en production. Ne renvoie que des états et des codes techniques.

type Check = "ok" | "absent" | `erreur:${string}`;

async function check(run: () => Promise<unknown>): Promise<Check> {
  try {
    await run();
    return "ok";
  } catch (error) {
    return `erreur:${errorCode(error)}`;
  }
}

export async function handleDeepHealth(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request.headers.get("authorization"), env.CRON_SECRET)) {
    return jsonError("UNAUTHENTICATED");
  }
  const redis = getRedis();
  const storage = getStorageAdmin();
  const [database, cache, files] = await Promise.all([
    check(() => withQueryTimeout(getDb(), (tx) => tx.execute(sql`select 1 from public.app_settings limit 1`))),
    redis ? check(() => redis.ping()) : Promise.resolve<Check>("absent"),
    storage ? check(async () => {
      const { error } = await storage.storage.getBucket("avatars");
      if (error) throw Object.assign(new Error("bucket"), { code: "STORAGE" });
    }) : Promise.resolve<Check>("absent"),
  ]);
  const healthy = database === "ok" && cache === "ok" && files === "ok";
  return jsonOk({ healthy, database, redis: cache, storage: files }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
