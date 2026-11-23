import "server-only";

import { z } from "zod";

import { ADMIN_TEXT } from "@/content/fr/admin";
import type { FormState } from "@/schemas/auth";
import type { Result } from "@/schemas/errors";
import { type Account, requireAdmin } from "@/server/auth/guards";
import { getDb } from "@/server/db/client";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";

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
};

export function adminDeps(): AdminDeps {
  return {
    admin: async () => {
      const access = await requireAdmin();
      return access.ok ? access.account : null;
    },
    setStatus: (adminId, userId, status) => setUserStatus(getDb(), adminId, userId, status),
    updateSetting: (adminId, key, value) => updateSetting(getDb(), adminId, key, value),
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
