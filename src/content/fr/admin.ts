// Textes du back-office (U25). Vouvoiement, phrases courtes.
const plural = (count: number, word: string, pluralWord = `${word}s`) => (count > 1 ? pluralWord : word);

export const ADMIN_TEXT = {
  metaTitle: "Back-office",
  shellLabel: "Back-office",
  backToApp: "Retour à l'application",
  nav: {
    label: "Navigation du back-office",
    dashboard: "Tableau de bord",
  },
  dashboard: {
    title: "Tableau de bord",
    description: (days: number) => `Activité des ${days} derniers jours, heure de Paris.`,
    tiles: {
      users: "Utilisateurs",
      usersHint: (count: number) => `${count} ${plural(count, "nouveau", "nouveaux")} sur la période`,
      today: "Identifications aujourd'hui",
      todayHint: (shown: number, counted: number) => `${shown} affichées, ${counted} décomptées`,
      successRate: "Taux de réussite",
      successRateHint: (cacheShare: string) => `Résultat affiché, toutes sources ; ${cacheShare} servies par le cache`,
      aiCost: "Coût IA aujourd'hui",
      aiCostHint: (cap: string, period: string) => `Plafond ${cap} ; ${period} sur la période`,
      revenue: "Revenu mensuel estimé",
      revenueHint: (monthly: number, yearly: number) =>
        `${monthly} ${plural(monthly, "mensuel")}, ${yearly} ${plural(yearly, "annuel")}`,
    },
    none: "—",
    revenueNote: "Estimation à partir des abonnements Premium en cours. Les montants encaissés sont dans Stripe.",
    stripeLink: "Ouvrir Stripe",
    table: {
      caption: "Activité par jour, du plus récent au plus ancien",
      day: "Jour",
      identifications: "Identifications",
      shown: "Affichées",
      counted: "Décomptées",
      fromCache: "Cache",
      aiCalls: "Appels IA",
      aiCost: "Coût IA",
    },
  },
} as const;
