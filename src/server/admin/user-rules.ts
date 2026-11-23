import "server-only";

// Règles pures du changement de statut d'un compte par un admin (U26). Testées à part.

export type AccountStatus = "active" | "suspended";

export type StatusTarget = { id: string; role: "user" | "admin"; status: AccountStatus; deleted: boolean };

export type StatusChangeRefusal = "not_found" | "self" | "admin_target";
export type StatusChangeDecision = { kind: "change" } | { kind: "unchanged" } | { kind: "refused"; reason: StatusChangeRefusal };

export function decideStatusChange(adminId: string, target: StatusTarget | null, wanted: AccountStatus): StatusChangeDecision {
  if (!target || target.deleted) return { kind: "refused", reason: "not_found" };
  // Pas de verrouillage du back-office : un admin ne touche ni à son compte ni à celui d'un autre admin.
  if (target.id === adminId) return { kind: "refused", reason: "self" };
  if (target.role === "admin") return { kind: "refused", reason: "admin_target" };
  return target.status === wanted ? { kind: "unchanged" } : { kind: "change" };
}

/** Recherche normalisée : espaces retirés ; vide = derniers inscrits. Les jokers SQL sont neutralisés. */
export function toSearchPattern(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return `%${trimmed.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
