"use client";

import { Camera, Trash2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { reloadAccount } from "@/client/account/account";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TEXT } from "@/content/fr/account";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

const responseSchema = z.union([
  z.object({ ok: z.literal(true), data: z.object({ avatarUrl: z.string().nullable() }) }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
]);

// Photo de profil (U05) : envoi au serveur, qui vérifie, recadre et réencode l'image. L'en-tête suit
// (compte rechargé). Taille contrôlée aussi dans le navigateur pour éviter un envoi inutile en 4G.
export function AvatarEditor({ initialUrl, initial }: { initialUrl: string | null; initial: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { avatar } = ACCOUNT_TEXT;

  const send = async (request: Promise<Response>, success: string) => {
    setBusy(true);
    try {
      const parsed = responseSchema.safeParse(await (await request).json());
      if (parsed.success && parsed.data.ok) {
        setUrl(parsed.data.data.avatarUrl);
        reloadAccount();
        toast.success(success);
      } else {
        toast.error(failureMessage(parsed.success && !parsed.data.ok ? parsed.data.error : null));
      }
    } catch {
      toast.error(avatar.errors.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(avatar.errors.too_large);
      return;
    }
    const body = new FormData();
    body.append("avatar", file);
    void send(fetch("/api/account/avatar", { method: "POST", body }), avatar.saved);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-brand ring-2 ring-border">
        <AnimatePresence mode="wait" initial={false}>
          {url ? (
            // Lien signé vers une image déjà réduite à 256 px par le serveur : pas d'optimiseur.
            <m.img
              key={url}
              src={url}
              alt={avatar.alt}
              className="size-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : (
            <m.span
              key="initiale"
              aria-hidden="true"
              className="flex size-full items-center justify-center font-display text-display font-bold text-inverse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {initial}
            </m.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => onFile(event.target.files?.[0])} />
          <Button type="button" variant="outline" className="h-11 gap-2 text-base" disabled={busy} onClick={() => input.current?.click()}>
            <Camera className="size-5" aria-hidden="true" />
            {busy ? avatar.uploading : url ? avatar.change : avatar.choose}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 gap-2 text-base"
              disabled={busy}
              onClick={() => void send(fetch("/api/account/avatar", { method: "DELETE" }), avatar.removed)}
            >
              <Trash2 className="size-5" aria-hidden="true" />
              {avatar.remove}
            </Button>
          ) : null}
        </div>
        <p className="max-w-prose text-sm text-muted-foreground">{avatar.hint}</p>
      </div>
    </div>
  );
}

// Le serveur renvoie un message clair pour une image refusée (trop lourde, format illisible).
function failureMessage(error: { code: string; message: string } | null): string {
  const { errors } = ACCOUNT_TEXT.avatar;
  if (error?.code === "ACCOUNT_SUSPENDED") return errors.suspended;
  if (error?.code === "VALIDATION_ERROR") return error.message;
  return errors.failed;
}
