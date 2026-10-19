import { describe, expect, it } from "vitest";

import { handleIdentifyRequest } from "./identify-request";

// Protection CSRF de POST /api/identify : refus avant toute autre étape (limitation, images, quota, IA).
// Code FORBIDDEN, distinct d'ACCOUNT_SUSPENDED (compte suspendu), pour que le message affiché soit juste.
describe("handleIdentifyRequest — origine", () => {
  it.each([
    ["autre site", { origin: "https://evil.example", host: "site.example" }],
    ["origine absente", { host: "site.example" }],
  ])("%s : 403 FORBIDDEN", async (_label, headers) => {
    const response = await handleIdentifyRequest(new Request("https://site.example/api/identify", { method: "POST", headers }));
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
  });
});
