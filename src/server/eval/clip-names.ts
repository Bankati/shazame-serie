// Corrigé de l'eval tiré des noms (U13) : le fondateur range les extraits par titre, l'outil retrouve la fiche TMDB.
// Deux rangements possibles, mélangeables :
// - un dossier par titre, vidéos nommées librement : « L'Attaque des Titans [serie]/extrait 1.mp4 » ;
// - un fichier par extrait à la racine : « Intouchables (2011).mp4 », « Intouchables (2011) 2.mp4 ».
// Mentions facultatives qui lèvent les doutes : l'année entre parenthèses, [serie] ou [film].

export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".3gp", ".3g2", ".mkv", ".avi"] as const;

export type TitleKind = "film" | "serie" | null;
export type ClipName = { title: string; year: number | null; kind: TitleKind };

export function isVideoFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function parseTitle(raw: string, stripClipNumber: boolean): ClipName | null {
  let name = raw;
  const kind: TitleKind = /\[(serie|série|series|tv|anime|animé)\]/i.test(name) ? "serie" : /\[film\]/i.test(name) ? "film" : null;
  name = name.replace(/\[[^\]]*\]/g, " ");
  // Numéro d'extrait final (« 2 », « - 2 », « #2 », « _2 ») : seulement pour un fichier, jamais pour un dossier
  // (« Kaiju No. 8 » est un titre).
  if (stripClipNumber) name = name.replace(/[\s_#-]+\d{1,2}\s*$/, "");
  const yearMatch = /\((\d{4})\)/.exec(name);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const title = name
    .replace(/\(\d{4}\)/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return title ? { title, year, kind } : null;
}

/** Titre lu dans le nom d'un fichier placé à la racine ; null si le nom ne contient pas de titre. */
export function parseClipName(fileName: string): ClipName | null {
  return parseTitle(fileName.replace(/\.[^.]+$/, ""), true);
}

/** Titre lu dans le nom d'un dossier (le nom entier est le titre, points et numéros compris). */
export function parseFolderName(folderName: string): ClipName | null {
  return parseTitle(folderName, false);
}

/**
 * D'où vient le titre d'un extrait (chemin relatif, séparateur « / ») : son dossier s'il est rangé dans un dossier,
 * sinon le nom du fichier. `source` sert de clé : une seule recherche TMDB par dossier.
 */
export function titleSource(relativePath: string): { source: string; name: ClipName | null } {
  const segments = relativePath.split("/");
  const fileName = segments.at(-1) ?? relativePath;
  if (segments.length === 1) return { source: fileName, name: parseClipName(fileName) };
  const folder = segments.at(-2) ?? "";
  return { source: segments.slice(0, -1).join("/"), name: parseFolderName(folder) };
}
