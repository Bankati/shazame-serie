import { TitlePoster } from "@/components/identify/title-poster";
import { TITLE_TEXT } from "@/content/fr/title";
import type { CastMember } from "@/server/catalog/catalog-provider";

// Distribution principale (CDC 12.2) : photos au format affiche, défilement horizontal sur mobile.
export function CastRow({ cast }: { cast: readonly CastMember[] }) {
  return (
    <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {cast.map((person) => (
        <li key={person.id} className="flex w-24 shrink-0 flex-col gap-2">
          <TitlePoster
            title={person.name}
            year={null}
            posterPath={person.profilePath}
            size="w185"
            width={96}
            alt={TITLE_TEXT.castPhoto(person.name)}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{person.name}</span>
            {person.character ? <span className="text-sm text-muted-foreground">{person.character}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
