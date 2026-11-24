import type { AccountAccess } from "@/server/auth/guards";

// Décision d'accès à une page du back-office (U25) : visiteur → connexion ; connecté sans le rôle admin (ou
// suspendu) → 404, pour ne pas révéler l'existence du back-office.
export type AdminPageAccess = { kind: "allowed"; adminId: string } | { kind: "sign-in" } | { kind: "not-found" };

export function adminPageAccess(access: AccountAccess): AdminPageAccess {
  if (access.ok) return { kind: "allowed", adminId: access.account.id };
  return access.code === "UNAUTHENTICATED" ? { kind: "sign-in" } : { kind: "not-found" };
}
