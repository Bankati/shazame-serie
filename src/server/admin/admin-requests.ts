import "server-only";

import { z } from "zod";

import { ADMIN_TEXT } from "@/content/fr/admin";
import type { FormState } from "@/schemas/auth";
import type { Result } from "@/schemas/errors";
import { type Account, requireAdmin } from "@/server/auth/guards";
import { getDb } from "@/server/db/client";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";

import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";

import type { ReviewRefusal, TitleRef } from "./report-review-rules";
import { reviewReport, type ReviewOutcome } from "./reports-admin";
import { parseSettingInput, settingKeySchema, type EditableSetting } from "./settings-input";
import { type SettingUpdateOutcome, updateSetting } from "./settings-admin";
import type { AccountStatus, StatusChangeRefusal } from "./user-rules";
import { setUserStatus, type StatusChangeOutcome } from "./users";

// Formulaires du back-office (U26). Ordre fixe (code-standards.md) : validation zod, rôle admin relu en base,
// service (qui journalise), réponse. L'origine est vérifiée par Next pour les Server Actions.

export type AdminDeps = {
  admin: () => Promise<Account | null>;
  setStatus: (adminId: string, userId: string, status: AccountStatus) => Promise<Result<StatusChangeOutcome, StatusChangeRefusal>>;
  updateSetting: (adminId: string, key: EditableSetting, value: number) => Promise<SettingUpdateOutcome>;
  /** Le titre existe-t-il dans le catalogue ? Lève une erreur si le catalogue est indisponible. */
  titleExists: (title: TitleRef) => Promise<boolean>;
  reviewReport: (adminId: string, reportId: string, retained: TitleRef, addToEval: boolean) => Promise<Result<ReviewOutcome, ReviewRefusal>>;
};

export function adminDeps(): AdminDeps {
  return {
    admin: async () => {
      const access = await requireAdmin();
      return access.ok ? access.account : null;
    },
    setStatus: (adminId, userId, status) => setUserStatus(getDb(), adminId, userId, status),
    updateSetting: (adminId, key, value) => updateSetting(getDb(), adminId, key, value),
    titleExists: async (title) => (await getCatalog().getTitleDetails(title.tmdbId, title.mediaType)) !== null,
    reviewReport: (adminId, reportId, retained, addToEval) => reviewReport(getDb(), adminId, reportId, retained, addToEval),
  };
}

const statusFormSchema = z.object({
  userId: z.uuid(),
  status: z.enum(["active", "suspended"]),
});

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export async function changeUserStatus(form: FormData, deps: AdminDeps = adminDeps()): Promise<FormState> {
  const text = ADMIN_TEXT.users.status;
  const input = statusFormSchema.safeParse({ userId: field(form, "userId"), status: field(form, "status") });
  if (!input.success) return { status: "error", message: text.invalid };

  const admin = await deps.admin();
  if (!admin) return { status: "error", message: ADMIN_TEXT.forbidden };

  try {
    const outcome = await deps.setStatus(admin.id, input.data.userId, input.data.status);
    if (!outcome.ok) return { status: "error", message: text.refused[outcome.error] };
    return { status: "success", message: input.data.status === "suspended" ? text.suspended : text.reactivated };
  } catch (error) {
    log.error("admin.user_status_failed", { code: errorCode(error) });
    return { status: "error", message: ADMIN_TEXT.failed };
  }
}

export async function changeSetting(form: FormData, deps: AdminDeps = adminDeps()): Promise<FormState> {
  const text = ADMIN_TEXT.settings;
  const key = settingKeySchema.safeParse(field(form, "key"));
  if (!key.success) return { status: "error", message: text.invalid };
  const value = parseSettingInput(key.data, field(form, "value"));
  if (value === null) return { status: "error", message: text.invalidValue[key.data], fields: { value: text.invalidValue[key.data] } };

  const admin = await deps.admin();
  if (!admin) return { status: "error", message: ADMIN_TEXT.forbidden };

  try {
    const outcome = await deps.updateSetting(admin.id, key.data, value);
    if (outcome === "missing") {
      log.error("admin.setting_missing", { key: key.data });
      return { status: "error", message: ADMIN_TEXT.failed };
    }
    return { status: "success", message: outcome === "changed" ? text.saved : text.unchanged };
  } catch (error) {
    log.error("admin.setting_update_failed", { code: errorCode(error) });
    return { status: "error", message: ADMIN_TEXT.failed };
  }
}

const reviewFormSchema = z.object({
  reportId: z.uuid(),
  tmdbId: z.coerce.number().int().positive().max(999_999_999),
  mediaType: z.enum(["movie", "tv"]),
  // Case à cocher : présente (« on ») seulement si cochée.
  addToEval: z.literal("on").optional(),
});

/** Revue d'un signalement (U26b) : le titre retenu est vérifié dans le catalogue avant toute écriture. */
export async function reviewReportRequest(form: FormData, deps: AdminDeps = adminDeps()): Promise<FormState> {
  const text = ADMIN_TEXT.reports.review;
  const input = reviewFormSchema.safeParse({
    reportId: field(form, "reportId"),
    tmdbId: field(form, "tmdbId"),
    mediaType: field(form, "mediaType"),
    addToEval: field(form, "addToEval") || undefined,
  });
  if (!input.success) return { status: "error", message: text.invalid };

  const admin = await deps.admin();
  if (!admin) return { status: "error", message: ADMIN_TEXT.forbidden };

  const retained: TitleRef = { tmdbId: input.data.tmdbId, mediaType: input.data.mediaType };
  try {
    if (!(await deps.titleExists(retained))) return { status: "error", message: text.unknownTitle };
  } catch (error) {
    log.error("admin.report_title_check_failed", { code: errorCode(error) });
    return { status: "error", message: text.catalogUnavailable };
  }

  try {
    const outcome = await deps.reviewReport(admin.id, input.data.reportId, retained, input.data.addToEval === "on");
    if (!outcome.ok) return { status: "error", message: text.refused[outcome.error] };
    return { status: "success", message: text.done[outcome.value.status] };
  } catch (error) {
    log.error("admin.report_review_failed", { code: errorCode(error) });
    return { status: "error", message: ADMIN_TEXT.failed };
  }
}
