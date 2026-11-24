import { Skeleton } from "@/components/ui/skeleton";

const TILES = 8;

// Chargement de « Ma liste » : affiché pendant la lecture des titres au catalogue.
export default function WatchlistLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4" aria-hidden="true">
        {Array.from({ length: TILES }, (_, index) => (
          <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
