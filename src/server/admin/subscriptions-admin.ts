import "server-only";

import { eq } from "drizzle-orm";

import type { Result } from "@/schemas/errors";
import type { ProviderSubscription } from "@/server/billing/billing-provider";
import { writeSubscription } from "@/server/billing/subscriptions";
import type { Database } from "@/server/db/client";
import { profiles, subscriptions } from "@/server/db/schema";

import { withAdminAudit } from "./audit";
import { decideSync, type SyncRefusal } from "./subscription-rules";

// Correction d'un abonnement par l'admin (U26c, CDC 12.9). L'abonnement a été relu chez le prestataire par
// l'appelant : la base est remise d'accord avec lui, jamais modifiée à la main (invariant 5). Écriture et
// journal dans la même transaction (invariant 6).

export type SyncOutcome = "changed" | "unchanged";

export async function syncSubscriptionFromProvider(
  db: Database,
  adminId: string,
  userId: string,
  fetched: ProviderSubscription,
  provider: string,
  now: Date = new Date(),
): Promise<Result<SyncOutcome, SyncRefusal>> {
  return withAdminAudit<Result<SyncOutcome, SyncRefusal>>(db, adminId, async (tx) => {
    const [account] = await tx
      .select({ deletedAt: profiles.deletedAt })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .for("update");
    // Ligne verrouillée comme dans le webhook : un événement simultané s'applique avant ou après, jamais mêlé.
    const [stored] = await tx
      .select({
        providerSubscriptionId: subscriptions.providerSubscriptionId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .for("update");
    const decision = decideSync(userId, { exists: account !== undefined && account.deletedAt === null }, stored ?? null, fetched, now);
    if (decision.kind === "refused") return { result: { ok: false, error: decision.reason }, audit: null };
    if (decision.kind === "unchanged") return { result: { ok: true, value: "unchanged" }, audit: null };

    // decideSync a vérifié statut et offre.
    if (!fetched.status || !fetched.plan) return { result: { ok: false, error: "not_usable" }, audit: null };
    await writeSubscription(tx, userId, { ...fetched, status: fetched.status, plan: fetched.plan }, provider);
    return {
      result: { ok: true, value: "changed" },
      audit: { action: "subscription.sync", targetType: "subscription", targetId: userId, before: decision.before, after: decision.after },
    };
  });
}
