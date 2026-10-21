// Textes de la page d'accueil. Chaque affirmation vient de context/project-overview.md
// (RG1, RG2 / AD-20, RG3, RG7, RG14, RG17, tarifs du CDC) : ne rien promettre d'autre.
export const HOME_TEXT = {
  hero: {
    eyebrow: "Gratuit, 15 identifications par jour",
    title: "Quel est ce film ?",
    highlight: "film",
    subtitle:
      "Vous avez vu un extrait sur TikTok, YouTube ou Instagram sans connaître son titre ? Envoyez la vidéo, une capture, le lien, ou décrivez la scène : nous retrouvons le film ou la série, sa fiche complète et où le regarder.",
  },
  howItWorks: {
    eyebrow: "Comment ça marche",
    title: "Trois étapes, quelques secondes",
    highlight: "quelques secondes",
    subtitle: "Pas d'application à installer : tout se passe dans votre navigateur, sur téléphone comme sur ordinateur.",
    steps: [
      {
        title: "Montrez-nous l'extrait",
        description: "Une vidéo de votre téléphone, 1 à 5 captures d'écran, le lien YouTube ou TikTok, ou quelques mots pour décrire la scène.",
      },
      {
        title: "Nous analysons les indices",
        description: "Votre navigateur tire quelques images nettes de la vidéo, qui n'est jamais envoyée. L'IA reconnaît la scène, puis nous vérifions le titre.",
      },
      {
        title: "Découvrez le titre",
        description: "Le film ou la série, son niveau de confiance, trois alternatives et la fiche complète.",
      },
    ],
  },
  features: {
    eyebrow: "Fonctionnalités",
    title: "Bien plus qu'un titre",
    highlight: "qu'un titre",
    subtitle: "Une fois le titre trouvé, tout ce qu'il faut pour le regarder et ne plus l'oublier.",
    sheet: {
      title: "La fiche complète",
      description: "Affiche, synopsis, distribution, bande-annonce et titres similaires, avec la raison de chaque suggestion.",
    },
    watch: {
      title: "Où le regarder",
      description: "Les services disponibles dans votre pays, en abonnement, en location ou à l'achat.",
    },
    confidence: {
      title: "Une confiance affichée",
      description: "Chaque résultat indique son niveau de certitude et propose trois alternatives.",
      sample: "Très probable",
    },
    watchlist: {
      title: "Votre liste de suivi",
      description: "Gardez de côté les titres à voir : 100 titres avec le compte gratuit, sans limite en Premium.",
    },
  },
  privacy: {
    eyebrow: "Confidentialité",
    title: "Votre vidéo ne quitte pas votre appareil",
    highlight: "ne quitte pas votre appareil",
    points: [
      {
        title: "Extraction dans le navigateur",
        description: "Seules quelques images (5 au plus) sont envoyées pour l'analyse, jamais la vidéo.",
      },
      {
        title: "Images supprimées",
        description: "Les images sont effacées au plus tard 24 heures après l'analyse, sauf si vous choisissez de les partager en signalant une erreur.",
      },
      {
        title: "Vos données vous appartiennent",
        description: "Aucune utilisation commerciale de vos données sans votre accord explicite. Export et suppression en libre-service.",
      },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Commencez gratuitement",
    highlight: "gratuitement",
    subtitle: "Une identification n'est décomptée que si un résultat d'au moins 50 % de confiance s'affiche.",
    perMonth: "par mois",
    free: {
      name: "Gratuit",
      price: "0 €",
      features: [
        "15 identifications par jour",
        "Fiches complètes et où regarder",
        "Liste de suivi jusqu'à 100 titres",
        "Historique de vos identifications",
      ],
      footnote: "Sans compte : 3 identifications par jour.",
    },
    premium: {
      name: "Premium",
      badge: "Le plus complet",
      price: "2,99 €",
      yearly: "ou 24,99 € par an",
      features: [
        "Jusqu'à 100 identifications par jour",
        "Liste de suivi illimitée",
        "Gestion de l'abonnement et factures",
        "Résiliable à tout moment, actif jusqu'à la fin de la période payée",
      ],
    },
    comingSoon: "Bientôt disponible",
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Vous vous demandez peut-être…",
    highlight: "peut-être…",
    items: [
      {
        question: "Comment fonctionne l'identification ?",
        answer:
          "Envoyez une vidéo, des captures d'écran, un lien YouTube ou TikTok, ou décrivez la scène. Pour une vidéo, votre navigateur en extrait quelques images nettes. Une IA analyse ces indices, puis nous vérifions le titre dans une grande base de films et de séries avant d'afficher le résultat avec son niveau de confiance.",
      },
      {
        question: "Ma vidéo est-elle envoyée sur vos serveurs ?",
        answer:
          "Non. Seules quelques images (5 au plus) extraites dans votre navigateur sont transmises, puis supprimées au plus tard 24 heures après l'analyse. Elles ne sont conservées que si vous signalez une erreur et l'acceptez explicitement.",
      },
      {
        question: "Combien d'identifications gratuites ai-je ?",
        answer:
          "15 par jour avec un compte gratuit, 3 par jour sans compte. Le compteur repart à zéro chaque jour à minuit, heure de Paris. Un essai n'est décompté que si un résultat d'au moins 50 % de confiance s'affiche.",
      },
      {
        question: "Que faire si le résultat est faux ?",
        answer:
          "Utilisez le bouton « Ce n'est pas le bon titre » sous le résultat et indiquez le bon titre. Vous pouvez aussi accepter que vos images servent à améliorer l'identification ; c'est facultatif.",
      },
      {
        question: "Que puis-je envoyer ?",
        answer:
          "Une vidéo MP4, MOV, WebM, M4V, 3GP, MKV ou AVI de 500 Mo au plus (pour une vidéo longue, vous choisissez le passage de 60 secondes à analyser), 1 à 5 captures d'écran, un lien YouTube ou TikTok, ou une description de 10 à 500 caractères. Choisissez de préférence un passage où l'image est nette et où l'on voit les personnages.",
      },
      {
        question: "Combien coûte le Premium et puis-je résilier ?",
        answer:
          "2,99 € par mois ou 24,99 € par an. Vous pouvez résilier à tout moment : le Premium reste actif jusqu'à la fin de la période déjà payée.",
      },
      {
        question: "D'où viennent les informations sur les films ?",
        answer:
          "Les fiches proviennent de TMDB (The Movie Database) et les disponibilités en streaming de JustWatch.",
      },
    ],
  },
  finalCta: {
    title: "Un extrait vous intrigue ?",
    highlight: "vous intrigue ?",
    subtitle: "Retrouvez son titre en quelques secondes.",
    button: "Identifier un titre",
  },
} as const;
