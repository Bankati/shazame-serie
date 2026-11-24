import { describe, expect, it } from "vitest";

import { createQuotaService, type QuotaIdentity, type QuotaLimits } from "./quota";
import { createMemoryQuotaStore } from "./quota-store";

const LIMITS: QuotaLimits = { visitorDaily: 3, freeDaily: 15, premiumDailyCap: 100 };
const FREE_USER: QuotaIdentity = { kind: "user", id: "u1", plan: "free" };
const VISITOR: QuotaIdentity = { kind: "visitor", id: "v1" };

function service(start = "2026-07-14T10:00:00Z") {
  let instant = new Date(start);
  const quota = createQuotaService({
    store: createMemoryQuotaStore(() => instant.getTime()),
    limits: async () => LIMITS,
    now: () => instant,
  });
  return { quota, setNow: (value: string) => (instant = new Date(value)) };
}

async function consumeOne(quota: ReturnType<typeof service>["quota"], identity: QuotaIdentity) {
  const outcome = await quota.reserve(identity);
  if (!outcome.ok) throw new Error("quota épuisé");
  outcome.reservation.commit();
}

describe("quota", () => {
  it("refuse la 16e identification d'un compte gratuit, avec resetAt au prochain minuit à Paris", async () => {
    const { quota } = service();
    for (let index = 0; index < 15; index++) await consumeOne(quota, FREE_USER);

    const sixteenth = await quota.reserve(FREE_USER);
    expect(sixteenth).toEqual({
      ok: false,
      status: { plan: "free", limit: 15, used: 15, remaining: 0, resetAt: new Date("2026-07-14T22:00:00.000Z") },
    });
  });

  it("indique le profil du quota (U21 : choix de l'invitation du paywall)", async () => {
    const { quota } = service();
    expect((await quota.status(VISITOR)).plan).toBe("visitor");
    expect((await quota.status(FREE_USER)).plan).toBe("free");
    expect((await quota.status({ ...FREE_USER, plan: "premium" })).plan).toBe("premium");
  });

  it("refuse la 4e identification d'un visiteur (RG2 : 3 par jour)", async () => {
    const { quota } = service();
    for (let index = 0; index < 3; index++) await consumeOne(quota, VISITOR);
    expect((await quota.reserve(VISITOR)).ok).toBe(false);
  });

  it("rend l'unité d'une réservation libérée (échec, résultat < 50 %)", async () => {
    const { quota } = service();
    const outcome = await quota.reserve(VISITOR);
    if (!outcome.ok) throw new Error();
    await outcome.reservation.release();
    expect((await quota.status(VISITOR)).remaining).toBe(3);
  });

  it("ne libère pas deux fois, et ne libère pas une réservation confirmée", async () => {
    const { quota } = service();
    await consumeOne(quota, VISITOR);
    const outcome = await quota.reserve(VISITOR);
    if (!outcome.ok) throw new Error();
    await outcome.reservation.release();
    await outcome.reservation.release();
    outcome.reservation.commit();
    expect(outcome.reservation.state).toBe("released");
    expect((await quota.status(VISITOR)).used).toBe(1);
  });

  it("deux réservations simultanées pour une seule unité restante : une seule aboutit", async () => {
    const { quota } = service();
    await consumeOne(quota, VISITOR);
    await consumeOne(quota, VISITOR);

    const [first, second] = await Promise.all([quota.reserve(VISITOR), quota.reserve(VISITOR)]);
    expect([first.ok, second.ok].sort()).toEqual([false, true]);
    expect((await quota.status(VISITOR)).remaining).toBe(0);
  });

  it("repart à zéro à minuit, heure de Paris, y compris la nuit du passage à l'heure d'hiver", async () => {
    const { quota, setNow } = service("2026-10-25T22:30:00Z"); // 23 h 30 à Paris (UTC+1 depuis 3 h)
    for (let index = 0; index < 3; index++) await consumeOne(quota, VISITOR);
    expect((await quota.status(VISITOR)).remaining).toBe(0);

    setNow("2026-10-25T23:00:01Z"); // 0 h 00 min 01 s à Paris, le 26
    expect((await quota.status(VISITOR)).remaining).toBe(3);
  });

  it("isole les identités et applique le plafond Premium", async () => {
    const { quota } = service();
    for (let index = 0; index < 3; index++) await consumeOne(quota, VISITOR);
    expect((await quota.status({ kind: "visitor", id: "v2" })).remaining).toBe(3);
    expect((await quota.status({ kind: "user", id: "p1", plan: "premium" })).limit).toBe(100);
  });
});
