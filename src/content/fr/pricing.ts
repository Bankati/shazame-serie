// Textes de la page /tarifs et du paywall (U21, CDC 12.8). Vouvoiement. Seulement ce qui est vrai aujourd'hui :
// le paiement n'est pas encore ouvert (D1, U22), l'offre Premium est donc annoncée « bientôt disponible ».
export const PRICING_TEXT = {
  metaTitle: "Tarifs",
  metaDescription:
    "Gratuit : 15 identifications par jour. Premium : jusqu'à 100 par jour pour 2,99 € par mois ou 24,99 € par an.",
  title: "Des tarifs simples",
  highlight: "simples",
  subtitle: "Commencez gratuitement. Passez au Premium seulement si vous identifiez beaucoup de titres.",
  freeCta: "Commencer gratuitement",
  premiumSoon: "Bientôt disponible",
  premiumSoonNote: "Le paiement en ligne ouvre très bientôt. En attendant, profitez de l'offre gratuite.",
  compareLink: "Comparer les offres",
  comparison: {
    title: "Comparer les offres",
    caption: "Ce que comprend chaque offre",
    feature: "Fonction",
    columns: ["Sans compte", "Gratuit", "Premium"],
    rows: [
      { label: "Identifications par jour", values: ["3", "15", "Jusqu'à 100"] },
      { label: "Fiches complètes et où regarder", values: [true, true, true] },
      { label: "Historique des identifications", values: [false, true, true] },
      { label: "Liste de suivi", values: [false, "100 titres", "Illimitée"] },
      { label: "Gestion de l'abonnement et factures", values: [false, false, true] },
    ],
    yes: "Inclus",
    no: "Non inclus",
  },
  faq: {
    title: "Questions sur les tarifs",
    items: [
      {
        question: "Quand une identification est-elle décomptée ?",
        answer:
          "Seulement quand un résultat d'au moins 50 % de confiance s'affiche. Un échec ou un résultat incertain ne vous coûte rien. Le compteur repart à zéro chaque jour à minuit, heure de Paris.",
      },
      {
        question: "Que se passe-t-il quand j'atteins ma limite ?",
        answer:
          "Vous ne pouvez plus lancer d'identification jusqu'à minuit (heure de Paris), mais les fiches, votre historique, votre liste et le calendrier des sorties restent consultables.",
      },
      {
        question: "Puis-je résilier le Premium ?",
        answer:
          "Oui, à tout moment, depuis votre compte. Le Premium reste actif jusqu'à la fin de la période déjà payée, puis votre compte repasse en gratuit sans rien perdre.",
      },
      {
        question: "Comment se fera le paiement ?",
        answer:
          "Par carte bancaire, sur la page sécurisée de notre prestataire de paiement. Nous ne voyons ni ne conservons jamais vos données de carte.",
      },
    ],
  },
  paywall: {
    visitor: {
      title: (limit: number) => `Vos ${limit} identifications du jour sont utilisées`,
      description: "Créez un compte gratuit pour en avoir 15 par jour, avec l'historique et la liste de suivi.",
      primary: "Créer un compte gratuit",
      secondary: "Voir les tarifs",
    },
    free: {
      title: (limit: number) => `Vos ${limit} identifications du jour sont utilisées`,
      description:
        "Avec Premium, identifiez jusqu'à 100 titres par jour et gardez une liste de suivi illimitée, pour 2,99 € par mois.",
      primary: "Découvrir Premium",
    },
    premium: {
      title: "Limite du jour atteinte",
      description: (limit: number) => `Votre abonnement Premium permet jusqu'à ${limit} identifications par jour.`,
    },
    reset: "De nouvelles identifications à minuit, heure de Paris.",
    browse: "En attendant, le reste du site vous est ouvert :",
    links: { calendar: "Calendrier des sorties", history: "Historique", watchlist: "Ma liste" },
  },
} as const;
