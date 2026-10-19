"use server";

import type { FormState } from "@/schemas/auth";
import { renameAccount } from "@/server/account/account-requests";

// Server Action du profil (U05) : aucune logique ici, tout est dans src/server/account.
export async function renameAction(_previous: FormState, form: FormData): Promise<FormState> {
  return renameAccount(form);
}
