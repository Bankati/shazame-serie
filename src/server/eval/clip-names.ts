// Corrigé de l'eval tiré du nom des fichiers (U13) : le fondateur nomme chaque extrait d'après son titre, l'outil
// retrouve la fiche TMDB. Conventions : « Intouchables (2011).mp4 », « La Casa de Papel [serie].mp4 », un numéro
// final pour plusieurs extraits du même titre (« Intouchables (2011) 2.mp4 »).

export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".3gp", ".3g2", ".mkv", ".avi"] as const;

export type ClipName = { title: string; year: number | null; series: boolean };

export function isVideoFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** Titre, année et type lus dans le nom du fichier ; null si le nom ne contient pas de titre. */
export function parseClipName(fileName: string): ClipName | null {
  let name = fileName.replace(/\.[^.]+$/, "");
  const series = /\[(serie|série|series|tv)\]/i.test(name);
  name = name.replace(/\[[^\]]*\]/g, " ");
  // Numéro d'extrait final (« 2 », « - 2 », « #2 », « _2 ») : jamais une année.
  name = name.replace(/[\s_#-]+\d{1,2}\s*$/, "");
  const yearMatch = /\((\d{4})\)/.exec(name);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const title = name
    .replace(/\(\d{4}\)/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return title ? { title, year, series } : null;
}
