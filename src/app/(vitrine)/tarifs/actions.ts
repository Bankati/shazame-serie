"use server";

import { redirect } from "next/navigation";

import { startCheckout } from "@/server/billing/billing-requests";

// Server Action « S'abonner » (U22) : aucune logique ici, tout est dans src/server/billing.
export async function checkoutAction(form: FormData): Promise<never> {
  redirect((await startCheckout(form)).to);
}
