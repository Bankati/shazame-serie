import { describe, expect, it } from "vitest";

import { createMemoryLimiter, LOGIN_ATTEMPTS_PER_HOUR } from "./auth-rate-limit";

const HOUR = 60 * 60 * 1000;

describe("createMemoryLimiter", () => {
  it("accepte 20 tentatives par heure et refuse la 21e (CDC 18.1)", async () => {
    let now = 1_000;
    const limiter = createMemoryLimiter(LOGIN_ATTEMPTS_PER_HOUR, HOUR, () => now);
    for (let attempt = 1; attempt <= 20; attempt++) {
      expect((await limiter.consume("ip-1")).ok).toBe(true);
    }
    const refused = await limiter.consume("ip-1");
    expect(refused).toEqual({ ok: false, retryAt: new Date(1_000 + HOUR) });
    // Une autre adresse n'est pas concernée.
    expect((await limiter.consume("ip-2")).ok).toBe(true);
    // Une heure plus tard, la fenêtre repart.
    now += HOUR;
    expect((await limiter.consume("ip-1")).ok).toBe(true);
  });
});
