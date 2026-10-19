import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogProvider } from "@/server/catalog/catalog-provider";

import { mapWithConcurrency } from "@/server/catalog/title-lookup";

import { enrichHistory, type HistoryRow } from "./history";
import { handlePurgeRequest } from "./purge-request";

const ROWS: HistoryRow[] = [
  { id: "a", tmdbId: 603, mediaType: "movie", confidence: 94, createdAt: new Date("2026-10-17T12:00:00Z") },
  { id: "b", tmdbId: 1396, mediaType: "tv", confidence: 61, createdAt: new Date("2026-10-16T08:00:00Z") },
];

function catalog(getTitleDetails: CatalogProvider["getTitleDetails"]): CatalogProvider {
  return { getTitleDetails } as unknown as CatalogProvider;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("enrichHistory", () => {
  it("ajoute titre, année et affiche, dans l'ordre des lignes", async () => {
    const entries = await enrichHistory(
      ROWS,
      catalog(async (tmdbId) => ({
        tmdbId,
        mediaType: "movie",
        title: tmdbId === 603 ? "Matrix" : "Breaking Bad",
        originalTitle: "",
        year: tmdbId === 603 ? 1999 : 2008,
        overview: "",
        genres: [],
        runtimeMinutes: null,
        posterPath: `/p${tmdbId}.jpg`,
        backdropPath: null,
        voteAverage: 8,
      })),
    );
    expect(entries.map((entry) => [entry.id, entry.title, entry.year, entry.posterPath, entry.identifiedAt])).toEqual([
      ["a", "Matrix", 1999, "/p603.jpg", "2026-10-17T12:00:00.000Z"],
      ["b", "Breaking Bad", 2008, "/p1396.jpg", "2026-10-16T08:00:00.000Z"],
    ]);
  });

  it("catalogue en panne ou absent : aucune ligne perdue, titre null", async () => {
    const failing = await enrichHistory(
      ROWS,
      catalog(async () => {
        throw new Error("TMDB indisponible");
      }),
    );
    expect(failing.map((entry) => [entry.id, entry.title, entry.confidence])).toEqual([
      ["a", null, 94],
      ["b", null, 61],
    ]);
    expect((await enrichHistory(ROWS, null)).every((entry) => entry.title === null)).toBe(true);
  });
});

describe("enrichHistory — budget de temps", () => {
  it("catalogue trop lent : la page n'attend pas au-delà du budget, les lignes restent sans titre", async () => {
    const slow = catalog(() => new Promise(() => {})); // ne répond jamais
    const started = Date.now();
    const entries = await enrichHistory(ROWS, slow, 50);
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(entries.map((entry) => [entry.id, entry.title])).toEqual([
      ["a", null],
      ["b", null],
    ]);
  });

  it("budget épuisé : plus aucun appel au catalogue pour les lignes suivantes", async () => {
    const many: HistoryRow[] = Array.from({ length: 30 }, (_, index) => ({
      id: `r${index}`,
      tmdbId: index + 1,
      mediaType: "movie" as const,
      confidence: 90,
      createdAt: new Date("2026-10-17T12:00:00Z"),
    }));
    const calls = vi.fn(() => new Promise<null>(() => {}));
    await enrichHistory(many, catalog(calls), 30);
    // Seule la première vague (8 appels simultanés) est partie avant l'échéance.
    expect(calls).toHaveBeenCalledTimes(8);
  });
});

describe("mapWithConcurrency", () => {
  it("garde l'ordre et ne dépasse jamais la limite d'appels simultanés", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapWithConcurrency([5, 1, 4, 2, 3, 6, 7, 8, 9, 10], 3, async (value) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, value));
      running--;
      return value * 10;
    });
    expect(results).toEqual([50, 10, 40, 20, 30, 60, 70, 80, 90, 100]);
    expect(peak).toBeLessThanOrEqual(3);
  });
});

describe("handlePurgeRequest", () => {
  const request = (authorization?: string) =>
    new Request("https://site.example/api/cron/purge-identifications", { headers: authorization ? { authorization } : undefined });

  it("refuse sans le secret des crons", async () => {
    const purge = vi.fn(async () => 0);
    expect((await handlePurgeRequest(request(), purge)).status).toBe(401);
    expect((await handlePurgeRequest(request("Bearer faux"), purge)).status).toBe(401);
    expect(purge).not.toHaveBeenCalled();
  });
});
