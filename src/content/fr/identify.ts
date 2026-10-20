import type { ClipProblem } from "@/client/frames/validate-clip";
import type { RejectReason } from "@/shared/frames/selection";

// Textes du parcours d'identification (U06). Vouvoiement, espaces insécables avant ? ! : ; (ui-context.md).
export const IDENTIFY_TEXT = {
  dropzone: {
    title: "Choisir un clip ou des captures",
    constraints: "Une vidéo (MP4, MOV, WebM, M4V, 3GP, MKV, AVI, 500 Mo au maximum) ou 1 à 5 captures d'écran (JPEG, PNG, WebP, HEIC)",
    button: "Choisir un clip",
    dropHint: "ou glissez-le ici",
    dropActive: "Déposez la vidéo ou les captures pour les analyser",
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
  // Onglets du mode d'identification (U35).
  tabs: {
    label: "Comment identifier le titre",
    media: "Vidéo ou captures",
    description: "Description",
    link: "Lien",
  },
  // Identification par lien (U36).
  link: {
    label: "Coller le lien de la publication",
    hint: "Une vidéo YouTube (y compris les Shorts) ou TikTok. Seules ses informations publiques sont lues, jamais la vidéo.",
    placeholder: "https://www.tiktok.com/@compte/video/…",
    submit: "Identifier",
    sending: "Recherche en cours…",
    privacy: "Nous lisons uniquement les informations publiques de la publication : la vidéo n'est jamais téléchargée.",
    another: "Coller un autre lien",
  },
  // Identification par description (U35).
  description: {
    label: "Décrire le film ou la série",
    hint: "L'histoire, une scène, un personnage, un acteur, une époque : tout ce dont vous vous souvenez.",
    placeholder: "Ex. : un homme revit sans cesse la même journée dans une petite ville enneigée",
    counter: (length: number, min: number, max: number) =>
      length < min
        ? `${length} / ${max} caractères (${min} au minimum)`
        : `${length} / ${max} caractères`,
    submit: "Identifier",
    sending: "Recherche en cours…",
    privacy: "Votre description sert uniquement à cette recherche : elle n'est pas conservée.",
    another: "Décrire un autre titre",
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
    insufficientImages:
      "Aucune capture exploitable (trop sombre, floue ou identique à une autre). Choisissez une image nette, où la scène se voit bien.",
    another: "Choisir un autre clip",
    title: (title: string, year: number | null) => (year ? `${title} (${year})` : title),
    confidence: (percent: number, decision: "show" | "show_with_alternatives") =>
      `${percent} %, ${decision === "show" ? "très probable" : "probable"}`,
    alternatives: "Autres pistes :",
    notRecognized: "Nous n'avons pas reconnu ce clip avec assez de certitude. Essayez un autre extrait.",
    notRecognizedLink:
      "Nous n'avons pas reconnu le titre de cette publication avec assez de certitude. Envoyez plutôt le clip ou une capture.",
    notRecognizedDescription:
      "Nous n'avons pas reconnu ce titre avec assez de certitude. Ajoutez un détail précis : un acteur, une scène, une époque.",
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
    text: "Cette description n'a pas pu être analysée. Écrivez entre 10 et 500 caractères.",
    link_instagram:
      "Les liens Instagram ne sont pas encore pris en charge. Enregistrez le clip ou faites une capture d'écran, puis envoyez-la dans « Vidéo ou captures ».",
    link_unsupported: "Ce lien n'est pas pris en charge. Collez le lien d'une vidéo YouTube ou TikTok.",
    link_not_found: "Cette publication est introuvable ou n'est pas publique. Vérifiez le lien.",
    link_no_clues:
      "Cette publication ne donne pas assez d'indices. Envoyez plutôt le clip ou une capture d'écran dans « Vidéo ou captures ».",
    paused:
      "L'identification de nouveaux extraits est en pause pour aujourd'hui, en raison d'une forte affluence. Les extraits déjà connus restent reconnus ; réessayez demain.",
    suspended: "Votre compte est suspendu : l'identification n'est pas disponible.",
    unavailable: "L'identification est momentanément indisponible. Réessayez dans quelques instants.",
  },
  problems: {
    unsupported_format:
      "Ce format n'est pas pris en charge. Choisissez une vidéo (MP4, MOV, WebM, M4V, 3GP, MKV, AVI) ou des captures (JPEG, PNG, WebP, HEIC).",
    empty: "Ce fichier est vide. Choisissez un autre clip.",
    too_large: "Cette vidéo dépasse 500 Mo. Coupez-la ou choisissez un autre extrait.",
    too_short: "Ce clip dure moins d'une seconde. Choisissez un extrait plus long.",
    unreadable:
      "Cette vidéo n'a pas pu être lue, même avec le lecteur de secours. Exportez-la en MP4 depuis votre téléphone, ou choisissez un autre extrait.",
    mixed_files: "Choisissez soit une vidéo, soit des captures d'écran, pas les deux à la fois.",
    several_videos: "Choisissez une seule vidéo à la fois.",
    too_many_images: "Choisissez 5 captures au maximum.",
    image_too_large: "Une des images dépasse 30 Mo. Choisissez une capture d'écran plutôt que la photo d'origine.",
    image_unreadable: "Une des images n'a pas pu être lue. Choisissez une capture JPEG, PNG, WebP ou HEIC.",
  } satisfies Record<ClipProblem, string>,
} as const;
