import { describe, expect, it } from "vitest";

import type { ProviderSubscription } from "@/server/billing/billing-provider";

import { decideSync, type StoredSubscription } from "./subscription-rules";

const USER = "u1";
const NOW = new Date("2026-11-26T12:00:00Z");
const END = new Date("2026-12-26T12:00:00Z");

const fetched = (fields: Partial<ProviderSubscription> = {}): ProviderSubscription => ({
  providerSubscriptionId: "sub_A",
  providerCustomerId: "cus_A",
  userId: USER,
  plan: "monthly",
  status: "active",
  currentPeriodEnd: END,
  cancelAtPeriodEnd: false,
  ...fields,
});

const stored = (fields: Partial<StoredSubscription> = {}): StoredSubscription => ({
  providerSubscriptionId: "sub_A",
  plan: "monthly",
  status: "active",
  currentPeriodEnd: END,
  cancelAtPeriodEnd: false,
  ...fields,
});

describe("decideSync", () => {
  it("écrit un abonnement manquant en base, tous ses champs journalisés", () => {
    const decision = decideSync(USER, { exists: true }, null, fetched(), NOW);
    expect(decision).toEqual({
      kind: "write",
      before: { providerSubscriptionId: null, plan: null, status: null, currentPeriodEnd: null, cancelAtPeriodEnd: null },
      after: { providerSubscriptionId: "sub_A", plan: "monthly", status: "active", currentPeriodEnd: END.toISOString(), cancelAtPeriodEnd: false },
    });
  });

  it("ne journalise que les champs modifiés", () => {
    const decision = decideSync(USER, { exists: true }, stored({ status: "past_due" }), fetched({ cancelAtPeriodEnd: true }), NOW);
    expect(decision).toEqual({
      kind: "write",
      before: { status: "past_due", cancelAtPeriodEnd: false },
      after: { status: "active", cancelAtPeriodEnd: true },
    });
  });

  it("ne change rien quand la base est déjà d'accord avec le prestataire", () => {
    expect(decideSync(USER, { exists: true }, stored(), fetched(), NOW)).toEqual({ kind: "unchanged" });
  });

  it("accepte un abonnement sans compte dans ses métadonnées, refuse celui d'un autre compte", () => {
    expect(decideSync(USER, { exists: true }, null, fetched({ userId: null }), NOW).kind).toBe("write");
    expect(decideSync(USER, { exists: true }, null, fetched({ userId: "u2" }), NOW)).toEqual({ kind: "refused", reason: "other_account" });
  });

  it("refuse un compte absent et un abonnement sans statut ou sans offre connue", () => {
    expect(decideSync(USER, { exists: false }, null, fetched(), NOW)).toEqual({ kind: "refused", reason: "not_found" });
    expect(decideSync(USER, { exists: true }, null, fetched({ status: null }), NOW)).toEqual({ kind: "refused", reason: "not_usable" });
    expect(decideSync(USER, { exists: true }, null, fetched({ plan: null }), NOW)).toEqual({ kind: "refused", reason: "not_usable" });
  });

  it("ne remplace pas un autre abonnement encore en cours, mais remplace un abonnement terminé", () => {
    expect(decideSync(USER, { exists: true }, stored({ providerSubscriptionId: "sub_OLD" }), fetched(), NOW)).toEqual({
      kind: "refused",
      reason: "conflict",
    });
    const ended = stored({ providerSubscriptionId: "sub_OLD", status: "canceled", currentPeriodEnd: new Date("2026-11-01T00:00:00Z") });
    expect(decideSync(USER, { exists: true }, ended, fetched(), NOW).kind).toBe("write");
  });
});
