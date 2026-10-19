import { IDENTIFY_TEXT } from "@/content/fr/identify";
import type { IdentifiedTitle } from "@/schemas/identify";

import { TitlePoster } from "./title-poster";

type AlternativeListProps = {
  titles: readonly IdentifiedTitle[];
  heading: string;
  /** Un clic affiche la piste comme résultat principal (sans nouvelle analyse). */
  onSelect: (title: IdentifiedTitle) => void;
};

export function AlternativeList({ titles, heading, onSelect }: AlternativeListProps) {
  const { card, result } = IDENTIFY_TEXT;
  if (titles.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{heading}</h3>
      <ul className="flex flex-col gap-1">
        {titles.map((title) => (
          <li key={`${title.mediaType}-${title.tmdbId}`}>
            <button
              type="button"
              onClick={() => onSelect(title)}
              aria-label={card.showAlternative(result.title(title.title, title.year))}
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-1 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <TitlePoster title={title.title} year={title.year} posterPath={title.posterPath} size="w92" width={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{result.title(title.title, title.year)}</span>
              <span className="text-sm text-muted-foreground">{card.percent(title.confidence)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
