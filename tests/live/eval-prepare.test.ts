import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { matchProposedTitle } from "@/server/catalog/match-title";
import { normalizeTitle, type TitleMatch } from "@/server/catalog/matching";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { type ClipName, isVideoFile, titleSource } from "@/server/eval/clip-names";

// Préparation du corrigé de l'eval (U13) : `npm run eval:prepare`. Parcourt EVAL_DIR et ses sous-dossiers ; le titre
// vient du dossier de la vidéo (« One Piece/extrait 3.mp4 ») ou, à la racine, du nom du fichier (« Intouchables
// (2011).mp4 »). Une recherche TMDB par titre ; manifest.json est écrit avec le titre trouvé (« trouve ») pour
// vérification. Les lignes déjà présentes ne sont jamais modifiées : une correction à la main est conservée.
const EVAL_DIR = process.env.EVAL_DIR ?? "";
const MANIFEST = path.join(EVAL_DIR, "manifest.json");

type Entry = { file: string; tmdbId: number; mediaType: "movie" | "tv"; difficulty: string; trouve?: string };

function listVideos(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return entry.name.startsWith(".") ? [] : listVideos(path.join(dir, entry.name), relative);
    return isVideoFile(entry.name) ? [relative] : [];
  });
}

const existing: Entry[] =
  EVAL_DIR && existsSync(MANIFEST) ? ((JSON.parse(readFileSync(MANIFEST, "utf8")) as { clips?: Entry[] }).clips ?? []) : [];
const known = new Set(existing.map((entry) => entry.file));
const videos = EVAL_DIR && existsSync(EVAL_DIR) ? listVideos(EVAL_DIR).sort() : [];

// Vidéos nouvelles regroupées par titre : une seule recherche par dossier.
const groups = new Map<string, { name: ClipName | null; files: string[] }>();
for (const file of videos.filter((video) => !known.has(video))) {
  const { source, name } = titleSource(file);
  const group = groups.get(source) ?? { name, files: [] };
  group.files.push(file);
  groups.set(source, group);
}

const added: Entry[] = [];
const found: string[] = [];
const problems: string[] = [];

/** Un titre plus long l'emporte sur le titre exact seulement s'il est au moins 10 fois plus populaire. */
const PREFIX_POPULARITY_RATIO = 10;

async function resolve(name: ClipName): Promise<TitleMatch | undefined> {
  // Film et série sont tous deux cherchés ([serie] ou [film] restreignent). Avec l'année, la meilleure correspondance
  // (titre et année) décide. Sans année, le titre exact le plus populaire, c'est presque toujours celui qu'on désigne
  // ainsi (« Lupin » : la série de 2021, pas le film de 2020).
  const kinds = name.kind ? [name.kind] : (["film", "serie"] as const);
  const matches = await Promise.all(
    kinds.map((kind) => matchProposedTitle(getCatalog(), { title: name.title, year: name.year, kind })),
  );
  const ranked = matches
    .flatMap((match) => (match.status === "matched" ? [match.best] : []))
    .sort((a, b) => b.quality - a.quality);
  if (name.year) return ranked[0];

  const candidates = matches
    .flatMap((match) => [...(match.status === "matched" ? [match.best] : []), ...match.alternatives])
    .filter((candidate) => !name.kind || (name.kind === "film") === (candidate.mediaType === "movie"));
  const wanted = normalizeTitle(name.title);
  const titlesOf = (candidate: TitleMatch) => [candidate.title, candidate.originalTitle].map(normalizeTitle);
  const byPopularity = (a: TitleMatch, b: TitleMatch) => b.popularity - a.popularity;
  const exact = candidates.filter((candidate) => titlesOf(candidate).includes(wanted)).sort(byPopularity)[0];
  const longer = candidates
    .filter((candidate) => titlesOf(candidate).some((title) => title.startsWith(`${wanted} `)))
    .sort(byPopularity)[0];
  // Un titre plus long (« Demon Slayer : Kimetsu no Yaiba ») ne passe devant le titre exact que s'il est bien plus
  // connu ; sinon « Lupin » deviendrait « Lupin III » et « My Hero Academia » un dérivé récent.
  if (exact && longer && longer.popularity >= PREFIX_POPULARITY_RATIO * exact.popularity) return longer;
  return exact ?? longer ?? ranked[0];
}

describe.skipIf(!EVAL_DIR)("préparation du corrigé", () => {
  it.each([...groups.keys()])(
    "%s",
    async (source) => {
      const group = groups.get(source);
      if (!group) return;
      const count = `${group.files.length} vidéo${group.files.length > 1 ? "s" : ""}`;
      if (!group.name) {
        problems.push(`${source} (${count}) : aucun titre dans le nom`);
        return;
      }
      const best = await resolve(group.name);
      if (!best) {
        problems.push(`${source} (${count}) : « ${group.name.title} » introuvable sur TMDB (vérifiez l'orthographe, ajoutez l'année ou [serie])`);
        return;
      }
      const trouve = `${best.title}${best.year ? ` (${best.year})` : ""}, ${best.mediaType === "movie" ? "film" : "série"}`;
      found.push(`${source} (${count}) → ${trouve} (TMDB ${best.mediaType}/${best.tmdbId})`);
      for (const file of group.files) added.push({ file, tmdbId: best.tmdbId, mediaType: best.mediaType, difficulty: "moyen", trouve });
    },
    30_000,
  );

  afterAll(() => {
    const clips = [...existing, ...added].sort((a, b) => a.file.localeCompare(b.file));
    if (clips.length > 0) writeFileSync(MANIFEST, `${JSON.stringify({ clips }, null, 2)}\n`);
    const lines = [
      `${videos.length} vidéos ; ${existing.length} déjà dans le corrigé ; ${added.length} ajoutées ; ${problems.length} titre(s) à revoir`,
      ...found.map((line) => `  ${line}`),
      ...problems.map((problem) => `  À REVOIR : ${problem}`),
      `Corrigé écrit dans ${MANIFEST} : vérifiez les titres trouvés avant npm run eval.`,
    ];
    process.stdout.write(`${lines.join("\n")}\n`);
    expect(true).toBe(true);
  });
});
