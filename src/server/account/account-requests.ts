import "server-only";

import { z } from "zod";

import { ACCOUNT_TEXT } from "@/content/fr/account";
import type { FormState } from "@/schemas/auth";
import { type Account, getCurrentAccount } from "@/server/auth/guards";
import { getDb } from "@/server/db/client";
import { jsonError, jsonOk } from "@/server/http/respond";
import { isSameOrigin } from "@/server/http/same-origin";
import { log } from "@/server/log";
import { getStorageAdmin } from "@/server/storage/admin-client";

import { AVATAR_MAX_UPLOAD_BYTES, processAvatar } from "./avatar-image";
import {
  AVATAR_URL_TTL_S,
  type AvatarStore,
  loadAccountPage,
  removeAvatar,
  replaceAvatar,
  supabaseAvatarStore,
  updateDisplayName,
} from "./profile-service";

// Modifications du profil (U05). Ordre fixe (code-standards.md) : origine, validation, session et statut,
// puis écriture sur le seul compte de la session. Réponses propres au compte : jamais en cache.
const NO_STORE = { "Cache-Control": "private, no-store" };
// Marge pour l'enveloppe multipart autour du fichier.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export type AccountDeps = {
  account: () => Promise<Account | null>;
  store: () => AvatarStore | null;
  replace: (store: AvatarStore, userId: string, image: Buffer) => Promise<string>;
  remove: (store: AvatarStore, userId: string) => Promise<void>;
  rename: (userId: string, displayName: string) => Promise<void>;
};

export function accountDeps(): AccountDeps {
  return {
    account: getCurrentAccount,
    store: () => {
      const client = getStorageAdmin();
      return client ? supabaseAvatarStore(client) : null;
    },
    replace: (store, userId, image) => replaceAvatar(getDb(), store, userId, image),
    remove: (store, userId) => removeAvatar(getDb(), store, userId),
    rename: (userId, displayName) => updateDisplayName(getDb(), userId, displayName),
  };
}

/** POST /api/account/avatar : champ `avatar` (JPEG, PNG ou WebP, 4 Mo au plus). */
export async function handleAvatarUpload(request: Request, deps: AccountDeps = accountDeps()): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", undefined, { headers: NO_STORE });
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > AVATAR_MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return jsonError("VALIDATION_ERROR", ACCOUNT_TEXT.avatar.errors.too_large, { headers: NO_STORE }, { reason: "too_large" });
  }
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("avatar");
  } catch {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  if (!(file instanceof File)) {
    return jsonError("VALIDATION_ERROR", ACCOUNT_TEXT.avatar.errors.unsupported, { headers: NO_STORE }, { reason: "unsupported" });
  }

  const access = await writableAccount(deps);
  if (!access.ok) return access.response;

  const image = await processAvatar(Buffer.from(await file.arrayBuffer()));
  if (!image.ok) {
    return jsonError("VALIDATION_ERROR", ACCOUNT_TEXT.avatar.errors[image.reason], { headers: NO_STORE }, { reason: image.reason });
  }
  const store = deps.store();
  if (!store) {
    log.error("avatar.storage_not_configured");
    return jsonError("UPSTREAM_ERROR", undefined, { headers: NO_STORE });
  }
  try {
    const path = await deps.replace(store, access.account.id, image.data);
    return jsonOk({ avatarUrl: await store.signedUrl(path, AVATAR_URL_TTL_S) }, { headers: NO_STORE });
  } catch {
    log.error("avatar.replace_failed");
    return jsonError("UPSTREAM_ERROR", undefined, { headers: NO_STORE });
  }
}

/** DELETE /api/account/avatar : retire la photo. */
export async function handleAvatarDelete(request: Request, deps: AccountDeps = accountDeps()): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", undefined, { headers: NO_STORE });
  }
  const access = await writableAccount(deps);
  if (!access.ok) return access.response;
  const store = deps.store();
  if (!store) {
    return jsonError("UPSTREAM_ERROR", undefined, { headers: NO_STORE });
  }
  try {
    await deps.remove(store, access.account.id);
    return jsonOk({ avatarUrl: null }, { headers: NO_STORE });
  } catch {
    log.error("avatar.remove_failed");
    return jsonError("UPSTREAM_ERROR", undefined, { headers: NO_STORE });
  }
}

const displayNameSchema = z.object({
  displayName: z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(80)),
});

/** Server Action du formulaire « Nom affiché ». */
export async function renameAccount(form: FormData, deps: AccountDeps = accountDeps()): Promise<FormState> {
  const { name } = ACCOUNT_TEXT;
  const raw = form.get("displayName");
  const input = displayNameSchema.safeParse({ displayName: typeof raw === "string" ? raw : "" });
  if (!input.success) {
    return { status: "error", message: name.invalid, fields: { displayName: name.invalid } };
  }
  const account = await deps.account();
  if (!account) {
    return { status: "error", message: name.signedOut };
  }
  if (account.status === "suspended") {
    return { status: "error", message: name.suspended };
  }
  try {
    await deps.rename(account.id, input.data.displayName);
    return { status: "success", message: name.saved };
  } catch {
    log.error("profile.rename_failed");
    return { status: "error", message: name.failed };
  }
}

async function writableAccount(deps: AccountDeps): Promise<{ ok: true; account: Account } | { ok: false; response: Response }> {
  const account = await deps.account();
  if (!account) {
    return { ok: false, response: jsonError("UNAUTHENTICATED", undefined, { headers: NO_STORE }) };
  }
  if (account.status === "suspended") {
    return { ok: false, response: jsonError("ACCOUNT_SUSPENDED", undefined, { headers: NO_STORE }) };
  }
  return { ok: true, account };
}

/** Page « Mon compte » : nom, date d'inscription et lien signé vers la photo. */
export function loadAccountPageFor(userId: string) {
  const client = getStorageAdmin();
  return loadAccountPage(getDb(), client ? supabaseAvatarStore(client) : null, userId);
}
