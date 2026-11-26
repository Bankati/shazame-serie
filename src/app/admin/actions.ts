"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/schemas/auth";
import { changeSetting, changeUserStatus, reviewReportRequest, syncSubscriptionRequest } from "@/server/admin/admin-requests";

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

export async function reportReviewAction(_previous: FormState, form: FormData): Promise<FormState> {
  const state = await reviewReportRequest(form);
  if (state.status === "success") {
    revalidatePath("/admin/signalements");
    revalidatePath(`/admin/signalements/${String(form.get("reportId"))}`);
  }
  return state;
}

export async function subscriptionSyncAction(_previous: FormState, form: FormData): Promise<FormState> {
  const state = await syncSubscriptionRequest(form);
  if (state.status === "success") {
    revalidatePath("/admin/utilisateurs");
    revalidatePath(`/admin/utilisateurs/${String(form.get("userId"))}`);
  }
  return state;
}
