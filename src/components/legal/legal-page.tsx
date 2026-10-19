import { LEGAL_TEXT } from "@/content/fr/legal";

// Page de texte légal provisoire (U04) : colonne unique, liste des engagements déjà décidés.
export function LegalPage({ title, version, points }: { title: string; version: string; points: readonly string[] }) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <h1 className="font-display text-display font-bold">{title}</h1>
      <p className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">{LEGAL_TEXT.draftNotice(version)}</p>
      <ul className="flex list-disc flex-col gap-3 pl-5 text-base text-foreground">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </article>
  );
}
