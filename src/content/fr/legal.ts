import { LEGAL_VERSIONS, MINIMUM_AGE } from "@/shared/legal/versions";

// Pages provisoires des textes légaux (U04). Les textes définitifs, validés par un juriste, arrivent en U27.
// Ne contiennent que des règles déjà décidées (project-overview.md, RG1 à RG17), sans invention.
export const LEGAL_TEXT = {
  draftNotice: (version: string) =>
    `Version provisoire (${version}). Le texte complet, validé juridiquement, sera publié avant l'ouverture du service ; il vous sera alors présenté pour acceptation.`,
  terms: {
    metaTitle: "Conditions d'utilisation",
    title: "Conditions d'utilisation",
    version: LEGAL_VERSIONS.terms,
    points: [
      `Le service est réservé aux personnes âgées d'au moins ${MINIMUM_AGE} ans.`,
      "L'offre gratuite comprend 15 identifications par jour, remises à zéro à minuit (heure de Paris). Seule une identification affichée avec une confiance d'au moins 50 % est décomptée.",
      "L'offre Premium est proposée à 2,99 € par mois ou 24,99 € par an. Après résiliation, elle reste active jusqu'à la fin de la période payée.",
      "Les fiches des titres utilisent l'API TMDB et les disponibilités en streaming sont fournies par JustWatch.",
    ],
  },
  privacy: {
    metaTitle: "Politique de confidentialité",
    title: "Politique de confidentialité",
    version: LEGAL_VERSIONS.privacy,
    points: [
      "Votre vidéo reste sur votre appareil : seules 2 à 5 images extraites par votre navigateur sont analysées.",
      "Ces images sont supprimées au plus tard 24 heures après l'analyse, sauf si vous signalez une erreur et acceptez qu'elles soient conservées.",
      "Votre historique conserve vos 50 dernières identifications, pendant 2 ans au maximum.",
      "Aucune donnée de carte bancaire n'est stockée par le service.",
      "Vous pouvez exporter vos données et supprimer votre compte à tout moment, sans intervention humaine.",
      "La mesure d'audience fonctionne sans cookie et sans vous identifier.",
    ],
  },
} as const;
