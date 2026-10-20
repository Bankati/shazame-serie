import { describe, expect, it } from "vitest";

import { handleDeepHealth } from "./deep-check";

// Sans CRON_SECRET valide, la vérification approfondie reste fermée (elle révèle l'état des services).
describe("GET /api/health/deep", () => {
  it.each([undefined, "Bearer faux"])("refusée sans le bon secret (%s)", async (authorization) => {
    const headers: Record<string, string> = authorization ? { authorization } : {};
    const response = await handleDeepHealth(new Request("https://site.example/api/health/deep", { headers }));
    expect(response.status).toBe(401);
  });
});
