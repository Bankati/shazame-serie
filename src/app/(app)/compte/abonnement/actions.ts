"use server";

import { redirect } from "next/navigation";

import { openPortal } from "@/server/billing/billing-requests";

// Server Action « Gérer mon abonnement » (U22) : portail du prestataire.
export async function portalAction(): Promise<never> {
  redirect((await openPortal()).to);
}
