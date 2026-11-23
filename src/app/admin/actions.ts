"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/schemas/auth";
import { changeSetting, changeUserStatus } from "@/server/admin/admin-requests";

// Server Actions du back-office (U26) : aucune logique ici, tout est dans src/server/admin.
export async function userStatusAction(_previous: FormState, form: FormData): Promise<FormState> {
  const state = await changeUserStatus(form);
  if (state.status === "success") revalidatePath("/admin/utilisateurs");
  return state;
}

export async function settingAction(_previous: FormState, form: FormData): Promise<FormState> {
  const state = await changeSetting(form);
  if (state.status === "success") revalidatePath("/admin/reglages");
  return state;
}
