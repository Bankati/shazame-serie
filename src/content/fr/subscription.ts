// Textes de la page « Mon abonnement » (U22, CDC 12.8 : plan, renouvellement, historique, résiliation). Vouvoiement.
export const SUBSCRIPTION_TEXT = {
  metaTitle: "Mon abonnement",
  title: "Mon abonnement",
  description: "Votre offre, son renouvellement et vos factures.",
  plans: { monthly: "Premium mensuel", yearly: "Premium annuel", free: "Offre gratuite" },
  prices: { monthly: "2,99 € par mois", yearly: "24,99 € par an" },
  status: {
    renews: (date: string) => `Renouvellement automatique le ${date}.`,
    endsOn: (date: string) => `Résilié : votre Premium reste actif jusqu'au ${date}.`,
    pastDue: (date: string) =>
      `Le dernier paiement a échoué. Mettez à jour votre moyen de paiement : sans cela, votre Premium s'arrêtera le ${date}.`,
    ended: (date: string) => `Votre Premium a pris fin le ${date}.`,
  },
  free: {
    description: "15 identifications par jour et une liste de suivi jusqu'à 100 titres.",
    cta: "Découvrir Premium",
  },
  manage: "Gérer mon abonnement",
  manageHint: "Moyen de paiement, factures et résiliation, sur la page sécurisée de Stripe.",
  welcome: {
    pending: "Paiement reçu, merci ! Votre Premium s'active, cela prend quelques secondes.",
    done: "Bienvenue dans Premium ! Vos identifications passent à 100 par jour.",
    slow: "L'activation prend plus de temps que prévu. Rechargez la page dans une minute ; si rien ne change, écrivez-nous.",
  },
  portalUnavailable: "La gestion de l'abonnement est momentanément indisponible. Réessayez dans quelques minutes.",
  invoices: {
    title: "Factures",
    empty: "Aucune facture pour le moment.",
    unavailable: "Vos factures sont momentanément indisponibles.",
    caption: "Vos dernières factures",
    columns: { date: "Date", number: "Numéro", amount: "Montant", status: "Statut" },
    status: { paid: "Payée", open: "En attente", void: "Annulée", uncollectible: "Impayée" },
    open: "Voir la facture",
    openLabel: (number: string) => `Voir la facture ${number} (nouvel onglet)`,
  },
} as const;
