import "server-only";

import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import type { Result } from "@/schemas/errors";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { profiles, subscriptions } from "@/server/db/schema";

import { withAdminAudit } from "./audit";
import { type AccountStatus, decideStatusChange, type StatusChangeRefusal, toSearchPattern } from "./user-rules";

// Gestion des utilisateurs par l'admin (U26) : recherche et suspension. L'appelant a vérifié le rôle admin.

export const USER_SEARCH_LIMIT = 50;

export type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
  status: AccountStatus;
  createdAt: Date;
  subscriptionPlan: "monthly" | "yearly" | null;
  subscriptionStatus: "active" | "past_due" | "canceled" | "expired" | null;
};

/** Recherche par email ou nom (sous-chaîne, sans casse) ; sans recherche, les derniers inscrits. */
export async function searchUsers(db: Database, query: string): Promise<AdminUserRow[]> {
  const pattern = toSearchPattern(query);
  return withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: profiles.id,
        email: authUsers.email,
        displayName: profiles.displayName,
        role: profiles.role,
        status: profiles.status,
        createdAt: profiles.createdAt,
        subscriptionPlan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
      })
      .from(profiles)
      .innerJoin(authUsers, eq(authUsers.id, profiles.id))
      .leftJoin(subscriptions, eq(subscriptions.userId, profiles.id))
      .where(
        pattern
          ? and(isNull(profiles.deletedAt), or(ilike(authUsers.email, pattern), ilike(profiles.displayName, pattern)))
          : isNull(profiles.deletedAt),
      )
      .orderBy(desc(profiles.createdAt))
      .limit(USER_SEARCH_LIMIT),
  );
}

/** Fiche d'un compte pour le back-office (U26c) ; null s'il n'existe pas ou a été supprimé. */
export async function loadAdminUser(db: Database, userId: string): Promise<AdminUserRow | null> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: profiles.id,
        email: authUsers.email,
        displayName: profiles.displayName,
        role: profiles.role,
        status: profiles.status,
        createdAt: profiles.createdAt,
        subscriptionPlan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
      })
      .from(profiles)
      .innerJoin(authUsers, eq(authUsers.id, profiles.id))
      .leftJoin(subscriptions, eq(subscriptions.userId, profiles.id))
      .where(and(eq(profiles.id, userId), isNull(profiles.deletedAt)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export type StatusChangeOutcome = "changed" | "unchanged";

/** Suspend ou réactive un compte ; journalisé dans la même transaction (invariant 6). */
export async function setUserStatus(
  db: Database,
  adminId: string,
  userId: string,
  wanted: AccountStatus,
): Promise<Result<StatusChangeOutcome, StatusChangeRefusal>> {
  return withAdminAudit<Result<StatusChangeOutcome, StatusChangeRefusal>>(db, adminId, async (tx) => {
    // Ligne verrouillée : deux admins simultanés ne journalisent pas deux fois le même changement.
    const [target] = await tx
      .select({ id: profiles.id, role: profiles.role, status: profiles.status, deletedAt: profiles.deletedAt })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .for("update");
    const decision = decideStatusChange(
      adminId,
      target ? { id: target.id, role: target.role, status: target.status, deleted: target.deletedAt !== null } : null,
      wanted,
    );
    if (decision.kind === "refused") return { result: { ok: false, error: decision.reason }, audit: null };
    if (decision.kind === "unchanged") return { result: { ok: true, value: "unchanged" }, audit: null };

    await tx.update(profiles).set({ status: wanted }).where(eq(profiles.id, userId));
    return {
      result: { ok: true, value: "changed" },
      audit: {
        action: wanted === "suspended" ? "user.suspend" : "user.reactivate",
        targetType: "user",
        targetId: userId,
        before: { status: target?.status },
        after: { status: wanted },
      },
    };
  });
}
