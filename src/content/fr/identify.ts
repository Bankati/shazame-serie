import type { ClipProblem } from "@/client/frames/validate-clip";
import type { RejectReason } from "@/shared/frames/selection";

// Textes du parcours d'identification (U06). Vouvoiement, espaces insécables avant ? ! : ; (ui-context.md).
export const IDENTIFY_TEXT = {
  dropzone: {
    title: "Choisir un clip",
    constraints: "MP4, MOV ou WebM, 60 secondes et 50 Mo au maximum",
    button: "Choisir un clip",
    dropHint: "ou glissez-le ici",
    dropActive: "Déposez le clip pour l'analyser",
    privacy: "Votre vidéo reste sur votre appareil : seules quelques images sont analysées.",
  },
  steps: {
    reading: "Lecture du clip…",
    extracting: (current: number, total: number) => `Extraction des images (${current} sur ${total})…`,
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
    comingSoon: "L'identification ouvre très bientôt.",
    insufficient:
      "Moins de 2 images exploitables dans ce clip (trop sombres, floues ou identiques). Choisissez un extrait plus lumineux, où l'image change.",
    another: "Choisir un autre clip",
  },
  problems: {
    unsupported_format: "Ce format n'est pas pris en charge. Choisissez un clip MP4, MOV ou WebM.",
    empty: "Ce fichier est vide. Choisissez un autre clip.",
    too_large: "Ce clip dépasse 50 Mo. Coupez-le ou choisissez un autre extrait.",
    too_long: "Ce clip dure plus de 60 secondes. Coupez-le ou choisissez un autre extrait.",
    too_short: "Ce clip dure moins d'une seconde. Choisissez un extrait plus long.",
    unreadable:
      "Ce clip n'est pas lisible sur cet appareil. Essayez un autre format (MP4 de préférence) ou un autre extrait.",
  } satisfies Record<ClipProblem, string>,
} as const;
