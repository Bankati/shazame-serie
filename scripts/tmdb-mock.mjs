#!/usr/bin/env node
// Faux serveur TMDB pour les tests navigateur (Playwright) : réponses figées des seuls points d'accès de
// l'accueil (tendances, mieux notés, genres). Aucun appel à TMDB, aucune clé. Tout le reste répond 404,
// comme un titre inexistant. Titres fictifs : aucune donnée réelle.
//
// Utilisation : node scripts/tmdb-mock.mjs  (port TMDB_MOCK_PORT, 3299 par défaut)
// L'application le vise avec TMDB_API_BASE_URL=http://127.0.0.1:3299/3 (interdit en production, env.ts).
import { createServer } from "node:http";

export const TMDB_MOCK_PORT = Number(process.env.TMDB_MOCK_PORT ?? 3299);
export const TMDB_MOCK_BASE_URL = `http://127.0.0.1:${TMDB_MOCK_PORT}/3`;
// Jeton factice au format attendu par env.ts (JWT) : le faux serveur ne le vérifie pas.
export const TMDB_MOCK_TOKEN = "eyJtb2NrIjp0cnVlfQ.eyJlMmUiOnRydWV9.c2lnbmF0dXJl";

function title(id, mediaType, name, genreIds) {
  return {
    id,
    media_type: mediaType,
    ...(mediaType === "movie" ? { title: name, release_date: "2026-06-12" } : { name, first_air_date: "2026-03-01" }),
    overview: `Synopsis de test pour ${name}.`,
    poster_path: `/affiche-${id}.jpg`,
    backdrop_path: `/fond-${id}.jpg`,
    vote_average: 7.8,
    genre_ids: genreIds,
    adult: false,
  };
}

const MOVIES = [
  title(9001, "movie", "Orbite Silencieuse", [878, 28]),
  title(9002, "movie", "Le Dernier Quai", [18]),
  title(9003, "movie", "Course Nocturne", [28, 53]),
  title(9004, "movie", "Planète Verte", [878, 14]),
  title(9005, "movie", "Le Rire du Phare", [35]),
  title(9006, "movie", "Station Kepler", [878]),
];
const SHOWS = [
  title(9101, "tv", "Les Gardiens du Port", [18]),
  title(9102, "tv", "Signal Perdu", [878]),
  title(9103, "tv", "Brigade Aurore", [28]),
];
const TOP_RATED = [
  title(9201, "movie", "La Grande Traversée", [18, 28]),
  title(9202, "movie", "Mémoires d'un Robot", [878, 18]),
  title(9203, "movie", "Duel au Crépuscule", [28]),
];
const GENRES = [
  { id: 28, name: "Action" },
  { id: 18, name: "Drame" },
  { id: 878, name: "Science-Fiction" },
  { id: 14, name: "Fantastique" },
  { id: 35, name: "Comédie" },
  { id: 53, name: "Thriller" },
];

// Fiche complète d'un titre fictif (U19 : page publique et carte d'aperçu).
const TITLE_PAGE = {
  id: 9001,
  title: "Orbite Silencieuse",
  original_title: "Silent Orbit",
  release_date: "2026-06-12",
  overview: "Synopsis de test pour Orbite Silencieuse.",
  genres: [{ id: 878, name: "Science-Fiction" }],
  runtime: 118,
  poster_path: "/affiche-9001.jpg",
  backdrop_path: "/fond-9001.jpg",
  vote_average: 7.8,
  vote_count: 1200,
  tagline: "Le silence a une adresse.",
  credits: { cast: [], crew: [] },
  videos: { results: [] },
  recommendations: { results: [] },
};

const ROUTES = {
  "/3/movie/9001": TITLE_PAGE,
  "/3/movie/9001/watch/providers": { id: 9001, results: {} },
  // Fiche ouverte depuis le calendrier (U42).
  "/3/movie/9302": { ...TITLE_PAGE, id: 9302, title: "Nuit Polaire", original_title: "Polar Night", release_date: "2026-11-04", poster_path: "/affiche-9302.jpg", tagline: null },
  "/3/movie/9302/watch/providers": { id: 9302, results: {} },
  "/health": { ok: true },
  "/3/trending/movie/week": { page: 1, results: MOVIES },
  "/3/trending/tv/week": { page: 1, results: SHOWS },
  "/3/movie/top_rated": { page: 1, results: TOP_RATED },
  "/3/genre/movie/list": { genres: GENRES },
  // Calendrier (U42) : sorties à venir (dates volontairement dans le désordre) et séries en diffusion.
  "/3/movie/upcoming": {
    page: 1,
    results: [
      { id: 9301, title: "Le Phare Lointain", release_date: "2026-12-18", overview: "Synopsis de test.", poster_path: "/affiche-9301.jpg", vote_average: 0, genre_ids: [18] },
      { id: 9302, title: "Nuit Polaire", release_date: "2026-11-04", overview: "Synopsis de test.", poster_path: "/affiche-9302.jpg", vote_average: 0, genre_ids: [878] },
    ],
  },
  "/3/tv/on_the_air": {
    page: 1,
    results: [{ id: 9401, name: "Les Veilleurs du Quai", first_air_date: "2026-09-01", overview: "Synopsis de test.", poster_path: "/affiche-9401.jpg", vote_average: 7.1, genre_ids: [80] }],
  },
};

export function startTmdbMock(port = TMDB_MOCK_PORT) {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const body = ROUTES[path];
    response.writeHead(body ? 200 : 404, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body ?? { status_code: 34, status_message: "Not found" }));
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

// Lancé directement (Playwright) et non importé (e2e-build.mjs).
if (process.argv[1]?.endsWith("tmdb-mock.mjs")) {
  await startTmdbMock();
  console.log(`Faux TMDB prêt : ${TMDB_MOCK_BASE_URL}`);
}
