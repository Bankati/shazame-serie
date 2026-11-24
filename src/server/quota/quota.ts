import "server-only";

import { nextParisMidnight, parisDay } from "@/lib/paris-time";
import { log } from "@/server/log";

import type { QuotaStore } from "./quota-store";

// Quotas d'identification (RG1 gratuit, RG2 visiteur, RG4 plafond Premium) : vérifier, réserver, confirmer, libérer.
// Une réservation est toujours confirmée ou libérée (invariant 3) : `settle` est idempotent.

/** Marge après minuit avant l'expiration de la clé : une libération à 23 h 59 retrouve encore sa clé. */
const KEY_EXPIRY_MARGIN_MS = 60 * 60 * 1000;

export type QuotaIdentity = { kind: "visitor"; id: string } | { kind: "user"; id: string; plan: "free" | "premium" };

export type QuotaLimits = { visitorDaily: number; freeDaily: number; premiumDailyCap: number };

/** Profil du quota (U21) : le paywall n'invite pas un visiteur, un compte gratuit et un Premium à la même chose. */
export type QuotaPlan = "visitor" | "free" | "premium";

export type QuotaStatus = { plan: QuotaPlan; limit: number; used: number; remaining: number; resetAt: Date };

export type Reservation = {
  /** Résultat affiché ≥ 50 % issu de l'IA : l'unité reste décomptée (RG3). */
  commit(): void;
  /** Échec, résultat < 50 %, erreur : l'unité est rendue (RG3, RG16). */
  release(): Promise<void>;
  readonly state: "pending" | "committed" | "released";
};

export type ReserveOutcome = { ok: true; reservation: Reservation } | { ok: false; status: QuotaStatus };

export type QuotaService = {
  status(identity: QuotaIdentity): Promise<QuotaStatus>;
  reserve(identity: QuotaIdentity): Promise<ReserveOutcome>;
};

export function limitFor(identity: QuotaIdentity, limits: QuotaLimits): number {
  if (identity.kind === "visitor") {
    return limits.visitorDaily;
  }
  return identity.plan === "premium" ? limits.premiumDailyCap : limits.freeDaily;
}

export function planOf(identity: QuotaIdentity): QuotaPlan {
  return identity.kind === "visitor" ? "visitor" : identity.plan;
}

export function quotaKey(identity: QuotaIdentity, day: string): string {
  return `quota:${identity.kind}:${identity.id}:${day}`;
}

export function createQuotaService(deps: {
  store: QuotaStore;
  limits: () => Promise<QuotaLimits>;
  now?: () => Date;
}): QuotaService {
  const now = deps.now ?? (() => new Date());

  async function context(identity: QuotaIdentity) {
    const instant = now();
    const resetAt = nextParisMidnight(instant);
    return { key: quotaKey(identity, parisDay(instant)), resetAt, limit: limitFor(identity, await deps.limits()) };
  }

  function statusOf(identity: QuotaIdentity, limit: number, used: number, resetAt: Date): QuotaStatus {
    return { plan: planOf(identity), limit, used, remaining: Math.max(0, limit - used), resetAt };
  }

  return {
    async status(identity) {
      const { key, resetAt, limit } = await context(identity);
      return statusOf(identity, limit, await deps.store.used(key), resetAt);
    },

    async reserve(identity) {
      const { key, resetAt, limit } = await context(identity);
      const result = await deps.store.reserve(key, limit, resetAt.getTime() + KEY_EXPIRY_MARGIN_MS);
      if (!result.reserved) {
        return { ok: false, status: statusOf(identity, limit, result.used, resetAt) };
      }

      let state: Reservation["state"] = "pending";
      const reservation: Reservation = {
        get state() {
          return state;
        },
        commit() {
          if (state === "pending") {
            state = "committed";
          }
        },
        async release() {
          if (state !== "pending") {
            return;
          }
          state = "released";
          try {
            await deps.store.release(key);
          } catch {
            // L'utilisateur perdrait une unité : on le signale pour correction manuelle, sans identifiant.
            log.error("quota.release_failed", { kind: identity.kind });
          }
        },
      };
      return { ok: true, reservation };
    },
  };
}
