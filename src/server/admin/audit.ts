import "server-only";

import { desc, sql } from "drizzle-orm";

import { type Database, type DbTransaction, withQueryTimeout } from "@/server/db/client";
import { adminAuditLog } from "@/server/db/schema";

// Journal d'audit du back-office (U26, invariant 6) : la ligne de journal est écrite dans la même transaction
// que la modification. Si l'une échoue, aucune des deux n'est enregistrée.

export type AuditAction = "user.suspend" | "user.reactivate" | "setting.update";
export type AuditTargetType = "user" | "setting";

export type AuditEntry = {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  /** Seulement les champs modifiés, jamais d'email ni de secret (invariant 9). */
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

/**
 * Exécute une mutation admin et journalise son effet. `work` renvoie l'entrée à journaliser, ou `null` quand
 * l'action n'a rien changé (aucune ligne écrite) ; son résultat métier est renvoyé tel quel.
 */
export async function withAdminAudit<T>(
  db: Database,
  adminId: string,
  work: (tx: DbTransaction) => Promise<{ result: T; audit: AuditEntry | null }>,
): Promise<T> {
  return withQueryTimeout(db, async (tx) => {
    const { result, audit } = await work(tx);
    if (audit) {
      await tx.insert(adminAuditLog).values({ adminId, ...audit });
    }
    return result;
  });
}

export const AUDIT_PAGE_SIZE = 50;

export type AuditLogRow = {
  id: string;
  adminId: string | null;
  adminName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  before: unknown;
  after: unknown;
  createdAt: Date;
};

/** Journal du plus récent au plus ancien ; `page` commence à 1. Une ligne de plus indique la page suivante. */
export async function loadAuditLog(db: Database, page: number): Promise<{ rows: AuditLogRow[]; hasNext: boolean }> {
  const offset = (Math.max(1, Math.trunc(page)) - 1) * AUDIT_PAGE_SIZE;
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: adminAuditLog.id,
        adminId: adminAuditLog.adminId,
        adminName: sql<string | null>`(select display_name from public.profiles p where p.id = ${adminAuditLog.adminId})`,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        before: adminAuditLog.before,
        after: adminAuditLog.after,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
      .limit(AUDIT_PAGE_SIZE + 1)
      .offset(offset),
  );
  return { rows: rows.slice(0, AUDIT_PAGE_SIZE), hasNext: rows.length > AUDIT_PAGE_SIZE };
}
