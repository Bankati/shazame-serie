import { describe, expect, it, vi } from "vitest";

import { SentryCheckError } from "@/server/health/sentry-check";

import { GET } from "./route";

const SECRET = "c".repeat(32);

vi.mock("@/server/env", () => ({ env: { CRON_SECRET: "c".repeat(32) } }));

function request(authorization?: string): Request {
  const headers = authorization ? { authorization } : undefined;
  return new Request("https://site.example/api/health/sentry-check", { headers });
}

describe("GET /api/health/sentry-check", () => {
  it("répond 401 UNAUTHENTICATED sans secret", async () => {
    const response = GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: { code: "UNAUTHENTICATED", message: "Accès refusé." } });
  });

  it("répond 401 avec un mauvais secret", () => {
    expect(GET(request(`Bearer ${"d".repeat(32)}`)).status).toBe(401);
  });

  it("lève l'erreur volontaire avec le bon secret", () => {
    expect(() => GET(request(`Bearer ${SECRET}`))).toThrow(SentryCheckError);
  });
});
