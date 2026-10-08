import { jsonOk } from "@/server/http/respond";

// Sonde de disponibilité et test de fumée des déploiements (.github/workflows/smoke.yml).
export function GET(): Response {
  return jsonOk({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
