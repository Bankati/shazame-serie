// Textes de la coquille : en-tête, menu mobile, pied de page, pages d'erreur.
export const LAYOUT_TEXT = {
  skipToContent: "Aller au contenu",
  homeLinkLabel: "Accueil",
  closeMenu: "Fermer le menu",
  nav: {
    label: "Navigation principale",
    links: [
      { href: "/#comment-ca-marche", label: "Comment ça marche" },
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#faq", label: "Questions fréquentes" },
    ],
    cta: { href: "/#identifier", label: "Identifier un clip" },
    openMenu: "Ouvrir le menu",
    menuTitle: "Menu",
  },
  footer: {
    tagline: "Le titre de cet extrait, sa fiche et où le regarder, en quelques secondes.",
    discoverTitle: "Découvrir",
    helpTitle: "Aide",
    helpLinks: [
      { href: "/#faq", label: "Questions fréquentes" },
      { href: "/#confidentialite", label: "Vos images et votre vie privée" },
    ],
    sourcesTitle: "Sources des données",
    tmdbNotice: "Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.",
    streamingNotice: "Les disponibilités en streaming sont fournies par JustWatch.",
    copyright: (year: number, name: string) => `© ${year} ${name}. Tous droits réservés.`,
  },
  notFound: {
    code: "Erreur 404",
    title: "Cette scène a été coupée au montage.",
    description: "La page demandée n'existe pas ou a été déplacée.",
    back: "Retour à l'accueil",
  },
  error: {
    title: "Une erreur inattendue s'est produite.",
    description: "Réessayez dans un instant. Si le problème persiste, revenez à l'accueil.",
    retry: "Réessayer",
    back: "Retour à l'accueil",
  },
} as const;
