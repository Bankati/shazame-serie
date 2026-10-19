import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 5;

// Chargement de l'historique (audit du 19 octobre 2026) : affiché pendant la lecture des titres au catalogue.
export default function HistoryLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: ROWS }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 md:p-4">
            <Skeleton className="aspect-[2/3] w-14 rounded-poster" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
