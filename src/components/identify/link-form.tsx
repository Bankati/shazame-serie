"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { LINK_MAX_LENGTH, parseVideoLink } from "@/shared/links/parse-link";

type LinkFormProps = {
  onSubmit: (url: string) => void;
  sending: boolean;
  /** Place le focus sur le champ à l'affichage (« Coller un autre lien »). */
  focusOnMount?: boolean;
};

// Lien de publication (U36) : YouTube ou TikTok. Le contrôle immédiat (même analyse que le serveur) évite un envoi
// inutile pour un lien Instagram ou d'un autre site ; le serveur reste seul juge.
export function LinkForm({ onSubmit, sending, focusOnMount = false }: LinkFormProps) {
  const { link, failures } = IDENTIFY_TEXT;
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const ids = { field: useId(), hint: useId(), problem: useId() };
  const parsed = value.trim() === "" ? null : parseVideoLink(value);
  const problem =
    parsed && !parsed.ok ? (parsed.reason === "instagram" ? failures.link_instagram : failures.link_unsupported) : null;

  useEffect(() => {
    if (focusOnMount) field.current?.focus();
  }, [focusOnMount]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (parsed?.ok && !sending) onSubmit(value.trim());
  }

  const showProblem = problem !== null && touched;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.field} className="font-display text-2xl font-bold">
          {link.label}
        </label>
        <p id={ids.hint} className="text-sm text-muted-foreground">
          {link.hint}
        </p>
      </div>
      <input
        ref={field}
        id={ids.field}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={value}
        maxLength={LINK_MAX_LENGTH}
        placeholder={link.placeholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={showProblem || undefined}
        aria-describedby={showProblem ? `${ids.hint} ${ids.problem}` : ids.hint}
        className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
      />
      {showProblem ? (
        <p id={ids.problem} role="alert" className="text-sm font-medium text-destructive">
          {problem}
        </p>
      ) : null}
      <Button type="submit" disabled={!parsed?.ok || sending} className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit sm:self-end">
        {sending ? link.sending : link.submit}
      </Button>
    </form>
  );
}
