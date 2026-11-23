import type { Metadata } from "next";

import { SettingForm } from "@/components/admin/setting-form";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatParisDateTime } from "@/lib/paris-time";
import { loadAdminSettings } from "@/server/admin/settings-admin";
import { formatSettingInput } from "@/server/admin/settings-input";
import { getDb } from "@/server/db/client";

import { settingAction } from "../actions";
import { requireAdminPage } from "../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.settings.title, robots: { index: false, follow: false } };

// Réglages (U26, CDC 12.9, AD-20) : quotas et plafond de dépense IA. Chaque enregistrement est journalisé.
export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/reglages");
  const settings = await loadAdminSettings(getDb());
  const text = ADMIN_TEXT.settings;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
      </div>
      {settings.map((setting) => (
        <SettingForm
          // La clé inclut la valeur : après un enregistrement, le champ reprend la valeur relue en base.
          key={`${setting.key}-${setting.value}`}
          action={settingAction}
          settingKey={setting.key}
          defaultValue={formatSettingInput(setting.key, setting.value)}
          updatedAt={formatParisDateTime(setting.updatedAt)}
        />
      ))}
    </div>
  );
}
