import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { matchProposedTitle } from "@/server/catalog/match-title";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { isVideoFile, parseClipName } from "@/server/eval/clip-names";

// Préparation du corrigé de l'eval (U13) : `npm run eval:prepare`. Lit les vidéos du dossier EVAL_DIR, tire le
// titre du nom de chaque fichier (« Intouchables (2011).mp4 », « La Casa de Papel [serie].mp4 »), retrouve la fiche
// TMDB et écrit manifest.json. Chaque ligne indique le titre trouvé (« trouve ») pour vérification. Les lignes déjà
// présentes ne sont jamais modifiées : une correction à la main est conservée.
const EVAL_DIR = process.env.EVAL_DIR ?? "";
const MANIFEST = path.join(EVAL_DIR, "manifest.json");

type Entry = { file: string; tmdbId: number; mediaType: "movie" | "tv"; difficulty: string; trouve?: string };

const existing: Entry[] =
  EVAL_DIR && existsSync(MANIFEST)
    ? ((JSON.parse(readFileSync(MANIFEST, "utf8")) as { clips?: Entry[] }).clips ?? [])
    : [];
const known = new Set(existing.map((entry) => entry.file));
const files = EVAL_DIR && existsSync(EVAL_DIR) ? readdirSync(EVAL_DIR).filter(isVideoFile).sort() : [];
const added: Entry[] = [];
const problems: string[] = [];

describe.skipIf(!EVAL_DIR)("préparation du corrigé", () => {
  it.each(files.filter((file) => !known.has(file)))(
    "%s",
    async (file) => {
      const parsed = parseClipName(file);
      if (!parsed) {
        problems.push(`${file} : aucun titre dans le nom du fichier`);
        return;
      }
      // Sans mention [serie], film et série sont comparés : la meilleure correspondance l'emporte (un titre exact de
      // série doit battre un film au titre seulement proche, ex. « Breaking Bad » contre « Breaking Bad Wolf »). À titre
      // égal (« Lupin », film de 2020 ou série de 2021), le plus populaire l'emporte ; préciser [serie] ou l'année lève le doute.
      const kinds = parsed.series ? (["serie"] as const) : (["film", "serie"] as const);
      const matches = await Promise.all(
        kinds.map((kind) => matchProposedTitle(getCatalog(), { title: parsed.title, year: parsed.year, kind })),
      );
      const best = matches
        .flatMap((match) => (match.status === "matched" ? [match.best] : []))
        .sort((a, b) => b.signals.title - a.signals.title || b.popularity - a.popularity)[0];
      if (best) {
        added.push({
          file,
          tmdbId: best.tmdbId,
          mediaType: best.mediaType,
          difficulty: "moyen",
          trouve: `${best.title}${best.year ? ` (${best.year})` : ""}, ${best.mediaType === "movie" ? "film" : "série"}`,
        });
        return;
      }
      problems.push(`${file} : « ${parsed.title} » introuvable sur TMDB (vérifiez l'orthographe ou ajoutez l'année)`);
    },
    30_000,
  );

  afterAll(() => {
    const clips = [...existing, ...added].sort((a, b) => a.file.localeCompare(b.file));
    if (clips.length > 0) writeFileSync(MANIFEST, `${JSON.stringify({ clips }, null, 2)}\n`);
    const lines = [
      `${files.length} vidéos ; ${existing.length} déjà dans le corrigé ; ${added.length} ajoutées ; ${problems.length} à revoir`,
      ...added.map((entry) => `  ${entry.file} → ${entry.trouve} (TMDB ${entry.mediaType}/${entry.tmdbId})`),
      ...problems.map((problem) => `  À REVOIR : ${problem}`),
      `Corrigé écrit dans ${MANIFEST} : vérifiez les titres trouvés avant npm run eval.`,
    ];
    process.stdout.write(`${lines.join("\n")}\n`);
    expect(true).toBe(true);
  });
});
