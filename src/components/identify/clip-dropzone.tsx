"use client";

import { Upload } from "lucide-react";
import { type DragEvent, useEffect, useId, useRef, useState } from "react";

import { CLIP_ACCEPT, type ClipProblem } from "@/client/frames/validate-clip";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { cn } from "@/lib/utils";

type ClipDropzoneProps = {
  onFile: (file: File) => void;
  problem?: ClipProblem;
  /** Place le focus sur le bouton à l'affichage (retour depuis « Choisir un autre clip »). */
  focusOnMount?: boolean;
};

// Zone d'envoi : bouton (clavier, mobile) + glisser-déposer (ordinateur). Le fichier reste dans le navigateur.
export function ClipDropzone({ onFile, problem, focusOnMount = false }: ClipDropzoneProps) {
  const { dropzone, problems } = IDENTIFY_TEXT;
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const constraintsId = useId();
  const problemId = useId();

  useEffect(() => {
    if (focusOnMount) {
      button.current?.focus();
    }
  }, [focusOnMount]);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      onFile(file);
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave se déclenche aussi en survolant un élément intérieur : on ne sort que de la zone elle-même.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
        dragging ? "border-primary bg-muted" : "border-input",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Upload className="size-6 text-link" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-display text-2xl font-bold">{dragging ? dropzone.dropActive : dropzone.title}</p>
        <p id={constraintsId} className="text-sm text-muted-foreground">
          {dropzone.constraints}
        </p>
      </div>
      <Button
        ref={button}
        type="button"
        onClick={() => input.current?.click()}
        aria-describedby={problem ? `${constraintsId} ${problemId}` : constraintsId}
        className="h-11 w-full max-w-xs text-base"
      >
        {dropzone.button}
      </Button>
      <p className="hidden text-sm text-muted-foreground md:block">{dropzone.dropHint}</p>
      <input
        ref={input}
        type="file"
        accept={CLIP_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Permet de choisir à nouveau le même fichier.
          event.target.value = "";
          if (file) {
            onFile(file);
          }
        }}
      />
      {problem ? (
        <p id={problemId} role="alert" className="text-sm font-medium text-destructive">
          {problems[problem]}
        </p>
      ) : null}
    </div>
  );
}
