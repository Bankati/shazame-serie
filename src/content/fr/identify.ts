import type { ClipProblem } from "@/client/frames/validate-clip";
import type { RejectReason } from "@/shared/frames/selection";

// Textes du parcours d'identification (U06). Vouvoiement, espaces insécables avant ? ! : ; (ui-context.md).
export const IDENTIFY_TEXT = {
  dropzone: {
    title: "Choisir un clip",
    constraints: "MP4, MOV, WebM, M4V, 3GP, MKV ou AVI, 500 Mo au maximum",
    button: "Choisir un clip",
    dropHint: "ou glissez-le ici",
    dropActive: "Déposez le clip pour l'analyser",
    privacy: "Votre vidéo reste sur votre appareil : seules quelques images sont analysées.",
  },
  steps: {
    reading: "Lecture de la vidéo…",
    cancel: "Annuler",
    preparing: (progress: number | null) =>
      progress === null
        ? "Cette vidéo demande le lecteur de secours (32 Mo, téléchargé une seule fois)…"
        : `Préparation du lecteur de secours (32 Mo, une seule fois) : ${Math.round(progress * 100)} %…`,
    analyzing: "Analyse des images…",
    extracting: (current: number, total: number) => `Extraction des images (${current} sur ${total})…`,
  },
  // Vidéo de plus de 60 s : choix du passage analysé (AD-40).
  excerpt: {
    title: "Choisissez le passage à analyser",
    explanation: (duration: string) =>
      `Cette vidéo dure ${duration}. Nous analysons un passage de 60 secondes : placez-le sur la scène à reconnaître.`,
    label: "Début du passage",
    range: (from: string, to: string) => `De ${from} à ${to}`,
    preview: "Aperçu du début du passage",
    analyze: "Analyser ce passage",
    another: "Choisir une autre vidéo",
  },
  strip: {
    label: "Images extraites du clip",
    frame: (index: number) => `Image ${index}`,
    kept: "Retenue",
    pending: "En attente",
    reasons: {
      dark: "Trop sombre",
      blurry: "Floue",
      duplicate: "Doublon",
    } satisfies Record<RejectReason, string>,
  },
  result: {
    ready: (count: number) => `${count} images prêtes.`,
    insufficient:
      "Moins de 2 images exploitables dans ce clip (trop sombres, floues ou identiques). Choisissez un extrait plus lumineux, où l'image change.",
    another: "Choisir un autre clip",
    title: (title: string, year: number | null) => (year ? `${title} (${year})` : title),
    confidence: (percent: number, decision: "show" | "show_with_alternatives") =>
      `${percent} %, ${decision === "show" ? "très probable" : "probable"}`,
    alternatives: "Autres pistes :",
    notRecognized: "Nous n'avons pas reconnu ce clip avec assez de certitude. Essayez un autre extrait.",
    remaining: (count: number) =>
      count === 0
        ? "C'était votre dernière identification aujourd'hui."
        : `Il vous reste ${count} identification${count > 1 ? "s" : ""} aujourd'hui.`,
  },
  // Fenêtre du résultat (centrée sur ordinateur, feuille sur mobile).
  dialog: {
    title: "Résultat",
    close: "Fermer le résultat",
    reopen: "Voir le résultat",
  },
  card: {
    label: "Résultat de l'identification",
    kind: { movie: "Film", tv: "Série" },
    meta: (year: number | null, kind: string) => (year ? `${year}, ${kind}` : kind),
    poster: (title: string, year: number | null) => (year ? `Affiche de ${title} (${year})` : `Affiche de ${title}`),
    noPoster: "Affiche indisponible",
    badge: {
      sure: (percent: number) => `Très probable, ${percent} %`,
      likely: (percent: number) => `Probable, ${percent} %`,
      possible: (percent: number) => `Piste possible, ${percent} %`,
    },
    alternatives: "Autres pistes",
    viewTitle: "Voir la fiche",
    leads: "Pistes possibles",
    showAlternative: (title: string) => `Afficher ${title} comme résultat`,
    percent: (percent: number) => `${percent} %`,
  },
  counter: {
    full: (count: number) => `${count} identification${count > 1 ? "s" : ""} restante${count > 1 ? "s" : ""} aujourd'hui`,
    short: (count: number) => `${count} restante${count > 1 ? "s" : ""}`,
  },
  failures: {
    quota: "Vous avez atteint votre limite d'identifications pour aujourd'hui. Elle se renouvelle à minuit (heure de Paris).",
    rate_limited: "Trop d'essais rapprochés. Patientez une minute, puis réessayez.",
    frames: "Ces images n'ont pas pu être analysées. Choisissez un autre extrait.",
    paused:
      "L'identification de nouveaux extraits est en pause pour aujourd'hui, en raison d'une forte affluence. Les extraits déjà connus restent reconnus ; réessayez demain.",
    suspended: "Votre compte est suspendu : l'identification n'est pas disponible.",
    unavailable: "L'identification est momentanément indisponible. Réessayez dans quelques instants.",
  },
  problems: {
    unsupported_format: "Ce format n'est pas pris en charge. Choisissez une vidéo MP4, MOV, WebM, M4V, 3GP, MKV ou AVI.",
    empty: "Ce fichier est vide. Choisissez un autre clip.",
    too_large: "Cette vidéo dépasse 500 Mo. Coupez-la ou choisissez un autre extrait.",
    too_short: "Ce clip dure moins d'une seconde. Choisissez un extrait plus long.",
    unreadable:
      "Cette vidéo n'a pas pu être lue, même avec le lecteur de secours. Exportez-la en MP4 depuis votre téléphone, ou choisissez un autre extrait.",
  } satisfies Record<ClipProblem, string>,
} as const;
