import "server-only";

import { notFound, redirect } from "next/navigation";

import { adminPageAccess } from "@/server/admin/access";
import { requireAdmin } from "@/server/auth/guards";

/** Garde de chaque page du back-office (invariant 7) : visiteur → connexion, non-admin → 404. */
export async function requireAdminPage(path: string): Promise<string> {
  const access = adminPageAccess(await requireAdmin());
  if (access.kind === "sign-in") redirect(`/connexion?suite=${encodeURIComponent(path)}`);
  if (access.kind === "not-found") notFound();
  return access.adminId;
}
