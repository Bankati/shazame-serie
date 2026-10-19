import { handleWatchlistChange, handleWatchlistGet } from "@/server/watchlist/watchlist-request";

// Liste de suivi du compte connecté (U18) : lecture, ajout, retrait.
export const runtime = "nodejs";

export function GET(): Promise<Response> {
  return handleWatchlistGet();
}

export function POST(request: Request): Promise<Response> {
  return handleWatchlistChange(request, "add");
}

export function DELETE(request: Request): Promise<Response> {
  return handleWatchlistChange(request, "remove");
}
