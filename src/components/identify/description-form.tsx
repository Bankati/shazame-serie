"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from "@/schemas/describe";

type DescriptionFormProps = {
  onSubmit: (text: string) => void;
  sending: boolean;
  /** Place le focus sur le champ à l'affichage (changement d'onglet, « Décrire un autre titre »). */
  focusOnMount?: boolean;
};

// Description écrite (U35) : 10 à 500 caractères, compteur visible et annoncé, mêmes bornes que le serveur.
export function DescriptionForm({ onSubmit, sending, focusOnMount = false }: DescriptionFormProps) {
  const { description } = IDENTIFY_TEXT;
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const ids = { field: useId(), hint: useId(), counter: useId() };
  const length = text.trim().length;
  const valid = length >= DESCRIPTION_MIN_LENGTH && length <= DESCRIPTION_MAX_LENGTH;

  useEffect(() => {
    if (focusOnMount) field.current?.focus();
  }, [focusOnMount]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid && !sending) onSubmit(text.trim());
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.field} className="font-display text-2xl font-bold">
          {description.label}
        </label>
        <p id={ids.hint} className="text-sm text-muted-foreground">
          {description.hint}
        </p>
      </div>
      <textarea
        ref={field}
        id={ids.field}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={DESCRIPTION_MAX_LENGTH}
        rows={4}
        placeholder={description.placeholder}
        aria-describedby={`${ids.hint} ${ids.counter}`}
        className="min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id={ids.counter} className="text-sm text-muted-foreground">
          {description.counter(length, DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH)}
        </p>
        <Button type="submit" disabled={!valid || sending} className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit">
          {sending ? description.sending : description.submit}
        </Button>
      </div>
    </form>
  );
}
