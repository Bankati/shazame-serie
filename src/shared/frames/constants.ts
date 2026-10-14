// Paramètres d'extraction communs au navigateur (U06) et à l'eval (U13), CDC 12.1.
// Les seuils de qualité sont des valeurs de départ, à calibrer sur le jeu de test (U13).

/** Contraintes du clip (CDC 12.1). */
export const CLIP_MAX_BYTES = 50 * 1024 * 1024;
export const CLIP_MAX_DURATION_S = 60;
export const CLIP_MIN_DURATION_S = 1;
export const CLIP_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
// Certains Android ne renseignent pas le type MIME : l'extension sert de second indice.
export const CLIP_EXTENSIONS = [".mp4", ".mov", ".webm"] as const;

/** Échantillonnage : on évite le début et la fin (fondus au noir, logos). */
export const CANDIDATE_COUNT = 5;
export const SAMPLE_START_RATIO = 0.1;
export const SAMPLE_END_RATIO = 0.9;

/** Paquet envoyé au serveur (invariant 1). */
export const MIN_USABLE_FRAMES = 2;
// Égal au nombre de candidates : la sélection n'a pas à plafonner. Sert au contrôle serveur (U11).
export const MAX_USABLE_FRAMES = 5;
export const FRAME_MAX_SIZE_PX = 768;
export const PACKAGE_MAX_BYTES = 1_572_864; // 1,5 Mo, même limite que le bucket `reports`
export const JPEG_QUALITY_STEPS = [0.8, 0.7, 0.6] as const;

/** Analyse de qualité, sur une copie réduite en niveaux de gris. */
export const ANALYSIS_WIDTH_PX = 160;
/** Luminosité moyenne (0 à 255) en dessous de laquelle l'image est jugée noire. */
export const DARK_MAX_MEAN_LUMINANCE = 20;
/** Variance du laplacien en dessous de laquelle l'image est jugée floue. */
export const BLUR_MIN_LAPLACIAN_VARIANCE = 20;
/** dHash : image réduite à 9 × 8 pixels, 64 bits. */
export const DHASH_WIDTH_PX = 9;
export const DHASH_HEIGHT_PX = 8;
/** Distance de Hamming (sur 64 bits) à partir de laquelle deux images sont jugées différentes. */
export const DUPLICATE_MAX_HAMMING = 5;
