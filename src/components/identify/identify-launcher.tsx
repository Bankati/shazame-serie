"use client";

import { ArrowRight, FileVideo, Link2, Lock, PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { IDENTIFY_PATH } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { LINK_MAX_LENGTH } from "@/shared/links/parse-link";

// Lanceur de la vitrine (U38, AD-46) : coller un lien mène à l'application qui l'identifie aussitôt ; les autres
// modes (vidéo ou captures, description) ouvrent l'application sur le bon onglet. L'identification elle-même
// n'a lieu que dans l'application : un seul circuit, un seul compteur.
export function IdentifyLauncher() {
  const { launcher, dropzone } = IDENTIFY_TEXT;
  const router = useRouter();
  const [value, setValue] = useState("");
  const fieldId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = value.trim();
    router.push(url ? `${IDENTIFY_PATH}?lien=${encodeURIComponent(url)}` : `${IDENTIFY_PATH}?mode=link`);
  }

  const shortcut =
    "inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground shadow-lg md:p-6">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={fieldId} className="sr-only">
          {launcher.linkLabel}
        </label>
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id={fieldId}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            maxLength={LINK_MAX_LENGTH}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={launcher.linkPlaceholder}
            className="h-12 w-full rounded-md border border-input bg-transparent pr-3 pl-10 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <Button type="submit" className="h-12 px-6 text-base font-semibold hover:bg-primary-hover">
          {launcher.submit}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm text-muted-foreground">{launcher.or}</span>
        <Link href={IDENTIFY_PATH} className={shortcut}>
          <FileVideo className="size-4 text-brand-strong" aria-hidden="true" />
          {launcher.media}
        </Link>
        <Link href={`${IDENTIFY_PATH}?mode=description`} className={shortcut}>
          <PenLine className="size-4 text-brand-strong" aria-hidden="true" />
          {launcher.description}
        </Link>
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        {dropzone.privacy}
      </p>
    </div>
  );
}
