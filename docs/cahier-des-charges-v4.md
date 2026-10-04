*CAHIER DES CHARGES - PLATEFORME CINÉPHILE*	*Dossier fonctionnel, technique et stratégique*

**CAHIER DES CHARGES**

Dossier fonctionnel, technique et stratégique

**PLATEFORME CINÉPHILE**

*Reconnaître un film ou une série à partir d'un clip, puis le découvrir, le suivre et savoir où le regarder.*

| **Version** | 4.0 - Synthèse des trois documents de référence |
| --- | --- |
| **Date** | 1er octobre 2026 |
| **Statut** | Confidentiel - Usage interne |
| **Auteur** | Bankati Bolagbede, fondateur et PDG |
| **Nom commercial** | À définir (anciennement Movie & Series Finder) |
| **Cible principale** | Cinéphiles francophones de 16 à 45 ans |
| **Développement** | Du 1er novembre au 31 décembre 2026 |
| **Lancement du MVP** | 31 décembre 2026 |
| **Budget du MVP** | 12 008 USD, soit environ 11 200 EUR |
| **Contact** | banking.tech@gmail.com |

*Les informations externes indiquent leur niveau de vérification (section 14.1). Les projections financières sont des hypothèses de travail.*

# Sommaire

	1. Présentation du projet	3

	2. Contexte et marché	4

	3. Problématique	5

	4. Solution proposée	5

	5. Acteurs du système	6

	6. Actions et responsabilités de chaque acteur	6

	7. Interfaces de la plateforme	7

	8. Périmètre du projet	8

	9. Objectifs principaux et secondaires	9

	10. Contraintes	10

	11. Règles de gestion	10

	12. Fonctionnalités détaillées	11

	13. Parcours utilisateurs clés	17

	14. Analyse concurrentielle	18

	15. Algorithmes et technologies propriétaires	27

	16. Exigences techniques	30

	17. Exigences de performance	32

	18. Sécurité et conformité	33

	19. Intégrations externes	35

	20. Compatibilité et accessibilité	36

	21. Modèle économique et projections	37

	22. Planning et feuille de route	39

	23. Équipe, budget et financement	40

	24. Risques et mitigation	40

	25. Incohérences relevées et arbitrages	41

	26. Sources et vérification	43

# 1. Présentation du projet

## 1.1 Contexte et problème à résoudre

Beaucoup de spectateurs tombent chaque jour sur un extrait de film ou de série sur TikTok, YouTube ou Instagram sans en connaître le titre. La recherche manuelle (commentaires, moteurs de recherche, forums) est lente et souvent sans résultat. Une fois le titre trouvé, il faut encore consulter plusieurs services pour comprendre de quoi il s'agit, lire des avis et savoir où le regarder.

Les outils existants se concentrent sur une seule étape : l'identification d'un clip (applications récentes, encore petites et en majorité anglophones), la disponibilité en streaming (JustWatch), la communauté de critiques (Letterboxd) ou la base de données (IMDb, TMDB). Aucun acteur observé ne réunit identification d'un clip, découverte personnalisée et expérience pensée pour le public francophone. Cette affirmation reste soumise aux limites de vérification décrites en section 14.

| **Le problème en une phrase** Un cinéphile qui voit un extrait de film sur un réseau social n'a aujourd'hui aucun moyen simple, fiable et en français de savoir de quel film il s'agit, puis de le retrouver, de le suivre et de savoir où le regarder. |
| --- |

## 1.2 La solution

La plateforme permet d'envoyer un court extrait vidéo et identifie le film ou la série en quelques secondes grâce à un modèle de vision par intelligence artificielle. Elle affiche ensuite une fiche complète (affiche, synopsis, distribution, bande-annonce) et les services de streaming où le titre est disponible. L'utilisateur peut l'ajouter à une liste de suivi et retrouver son historique. Le modèle économique repose sur un accès gratuit limité à 15 identifications par jour et un abonnement premium à 2,99 EUR par mois.

## 1.3 Positionnement stratégique

Le produit est présenté comme le « Shazam des films », mais l'ambition est une plateforme cinéphile complète, construite par étapes :

**Point d'entrée** : l'identification d'un clip, facile à comprendre, à essayer et à partager.

**Extension** : films, séries, animés, documentaires, courts métrages et bandes-annonces, avec recommandations personnalisées et communauté (à partir de la V2).

**Double modèle économique** : abonnements des utilisateurs (B2C) et, à terme, données comportementales anonymisées et API de recommandation pour les studios et plateformes (B2B).

**Cible** : cinéphiles francophones de 16 à 45 ans (France, Belgique, Suisse), puis Afrique francophone.

## 1.4 Nom et identité

Le nom commercial n'est pas encore choisi. Dans ce document, il est remplacé par « la plateforme ». L'identité visuelle décidée est : vert #10B981, bleu #0052CC et noir #1F2937. Avant toute publication, le nom devra faire l'objet d'une vérification de disponibilité (nom de domaine, marque, comptes de réseaux sociaux).

## 1.5 Périmètre géographique et linguistique

Marché de lancement : France, Belgique, Suisse. Langue unique en V1 : le français.

Expansion prévue : Afrique francophone (paiement par mobile money), Québec, puis autres langues en V2.

Devise de facturation en V1 : l'euro. Le choix définitif de la devise et de l'entité qui encaisse est à confirmer (voir sections 16 et 25).

# 2. Contexte et marché

## 2.1 Un marché de la découverte fragmenté

Le visionnage est réparti entre de nombreux services de streaming, et chaque étape de la découverte (trouver un titre, le comprendre, l'évaluer, le regarder) dépend d'un service différent. Les chiffres du tableau ci-dessous sont les seuls repères de marché que nous avons pu vérifier ; les autres chiffres des documents précédents (taille de marché, nombre d'abonnés, utilisateurs mensuels) ne sont pas repris car non vérifiés.

| **Acteur** | **Repère vérifié** | **Date** | **Source** |
| --- | --- | --- | --- |
| **Letterboxd** | Plus de 30 millions de membres dans le monde | Juin et juillet 2026 | S13, S14 |
| **JustWatch** | Plus de 40 millions d'utilisateurs mensuels, disponible dans 139 pays | Novembre 2023 | S16 |
| **Voola** | Environ 5 000 téléchargements sur Google Play | Date de l'article non précisée | S3 |
| **WhatMovieIsThis** | 2 abonnés sur la page Product Hunt du produit | Consultation 2026 | S8 |
| **VidScio** | 0 vote, 1 commentaire, 104e du classement quotidien Product Hunt | Consultation 2026 | S10 |

| **En résumé** Les deux références de la découverte (Letterboxd et JustWatch) comptent des dizaines de millions d'utilisateurs, ce qui prouve l'appétit du public. À l'inverse, les outils d'identification de clips restent très petits : le besoin existe, mais aucune solution n'a encore atteint une large audience. |
| --- |

## 2.2 Zones cibles

| **Zone** | **Langue** | **Rôle dans la stratégie** | **Phase** |
| --- | --- | --- | --- |
| **France** | Français | Cœur de cible et principale marché d'acquisition | **V1** |
| **Belgique et Suisse** | Français | Extension naturelle, même interface et mêmes contenus | **V1** |
| **Afrique francophone** | Français | Expansion avec paiement par mobile money et interface légère | **V2** |
| **Québec et Canada** | Français, anglais | Opportunité à étudier après stabilisation du produit | **V2** |
| **Autres marchés** | Multilingue | Ouverture progressive (espagnol, anglais, autres langues) | **V2** |

| **En résumé** Le lancement se concentre sur trois pays francophones avec une seule langue pour limiter le travail. L'Afrique francophone est un levier de croissance important, mais elle exige un mode de paiement local et une interface adaptée aux connexions lentes, ce qui justifie de la placer en V2. |
| --- |

# 3. Problématique

| **Problème** | **Situation actuelle** | **Conséquence pour l'utilisateur** |
| --- | --- | --- |
| **Identifier un clip** | Recherche manuelle (commentaires, forums, moteurs de recherche) ou applications spécialisées récentes, surtout anglophones (section 14) | Temps perdu, recherche souvent abandonnée |
| **Fragmentation des services** | Un service pour le catalogue de streaming, un autre pour les avis, un autre pour la base de données | Il faut visiter plusieurs sites pour une seule question |
| **Recommandations génériques** | Suggestions fondées sur la popularité ou sur le seul catalogue d'un service | Peu de découverte réellement personnalisée |
| **Offre francophone** | Peu d'outils d'identification pensés pour le français. À nuancer : Voola est relayé par la presse française, mais la langue de son interface n'est pas vérifiée | Interface, fiches et avis rarement adaptés au public visé |
| **Données de découverte** | Les studios et plateformes voient mal comment leurs titres sont découverts hors de leurs propres services (hypothèse à valider par des entretiens) | Opportunité B2B non prouvée à ce jour |

| **En résumé** Le problème central est simple et quotidien : savoir quel est ce film. Les autres problèmes en découlent. Le dernier (données pour les studios) est une hypothèse stratégique et non un fait établi. |
| --- |

# 4. Solution proposée

| **Pilier** | **Ce que fait la plateforme** | **Bénéfice pour l'utilisateur** | **Phase** |
| --- | --- | --- | --- |
| **Reconnaissance par IA** | Analyse quelques images extraites d'un clip et propose un titre avec un niveau de confiance | Réponse en quelques secondes au lieu de plusieurs minutes de recherche | **V1** |
| **Fiche complète et streaming** | Affiche les informations du titre et les services où le regarder | Tout au même endroit, sans changer de site | **V1** |
| **Compte, historique et liste de suivi** | Conserve les identifications et les titres à voir | Retrouver facilement ce que l'on a cherché | **V1** |
| **Recommandations** | Suggère des titres proches, d'abord par contenu puis selon le comportement de l'utilisateur | Découvrir des titres qui correspondent vraiment à ses goûts | **V1 puis V2** |
| **Communauté** | Avis, listes, discussions, profils publics | Partager et comparer avec d'autres cinéphiles | **V2** |
| **Données et API pour les professionnels** | Tendances de découverte agrégées et anonymisées, recommandation en marque blanche | Pour les clients B2B : comprendre comment leurs titres sont découverts | **V2** |

| **En résumé** La V1 livre uniquement la boucle utile : envoyer un clip, obtenir le titre, ouvrir la fiche, enregistrer le titre. Tout ce qui ajoute de la communauté ou de la donnée arrive ensuite, une fois que l'identification est jugée fiable. |
| --- |

# 5. Acteurs du système

| **Acteur** | **Type** | **Description** |
| --- | --- | --- |
| **Visiteur** | Humain | Personne sans compte. Peut tester l'identification dans la limite d'un quota réduit (proposition à valider, règle RG2). |
| **Utilisateur gratuit** | Humain | Compte créé. 15 identifications par jour, liste de suivi limitée, recommandations de base. |
| **Utilisateur premium** | Humain | Abonné. Identifications étendues, liste de suivi illimitée, recommandations avancées, aucune publicité. |
| **Administrateur** | Humain | Fondateur ou membre de l'équipe qui supervise utilisateurs, abonnements, qualité des identifications et signalements. |
| **Équipe technique** | Humain | Développe, déploie, surveille et sécurise la plateforme. |
| **Client B2B** | Organisation (V2) | Studio, plateforme ou agence qui accède à des tendances agrégées ou à l'API de recommandation. |
| **Fournisseur d'IA** | Système | Service de vision par IA qui analyse les images (OpenAI en V1). |
| **Base de métadonnées** | Système | TMDB pour les fiches, les affiches et les titres similaires (licence commerciale à obtenir). |
| **Service de paiement** | Système | Prestataire qui encaisse les abonnements et émet les justificatifs (voir sections 16 et 25). |
| **Données de streaming** | Système | Service qui indique où chaque titre est disponible, par pays. |
| **Service d'emails** | Système | Envoi des emails transactionnels (confirmation, réinitialisation, reçus). |

| **En résumé** La plateforme repose sur quatre types d'utilisateurs humains et cinq services externes. Le fournisseur d'IA, la base de métadonnées et le service de paiement sont critiques : sans eux, le produit ne peut pas fonctionner. |
| --- |

# 6. Actions et responsabilités de chaque acteur

| **Acteur** | **Actions principales** | **Responsabilités et limites** |
| --- | --- | --- |
| **Visiteur** | Envoyer un clip, voir un résultat, consulter une fiche, créer un compte | Soumis à un quota réduit. Aucun historique conservé. |
| **Utilisateur gratuit** | Identifier (15 par jour), consulter les fiches, gérer sa liste de suivi, signaler une erreur, partager un résultat, passer en premium | Respecter les conditions d'utilisation et ne pas envoyer de contenu illicite. Responsable de la confidentialité de son mot de passe. |
| **Utilisateur premium** | Mêmes actions sans limite quotidienne stricte, gérer son abonnement, télécharger ses factures | Soumis à un plafond d'usage raisonnable contre les abus (règle RG4). |
| **Administrateur** | Suivre les indicateurs, traiter les signalements d'erreur, suspendre ou supprimer un compte, gérer les abonnements, régler le plafond de dépense IA | Toute action sensible est journalisée. Respect des règles de protection des données. |
| **Équipe technique** | Déployer, surveiller, corriger, sauvegarder, mettre à jour les dépendances | Garantir la disponibilité, la sécurité et la conformité. Accès aux données limité au strict nécessaire. |
| **Client B2B (V2)** | Consulter des tendances agrégées, appeler l'API avec une clé, intégrer les recommandations | Utiliser les données selon le contrat. Aucune donnée personnelle n'est jamais fournie. |
| **Systèmes externes** | Répondre aux appels (identification, métadonnées, paiement, emails) | Chaque appel est limité en durée, journalisé et remplacé par un comportement de secours en cas de panne. |

| **En résumé** Chaque acteur a un périmètre clair. Les actions de l'administrateur sont les plus sensibles : elles sont toutes tracées, et aucune donnée personnelle n'est jamais transmise aux clients B2B. |
| --- |

# 7. Interfaces de la plateforme

| **Interface** | **Contenu** | **Acteurs** | **Priorité** |
| --- | --- | --- | --- |
| **Accueil et identification** | Zone d'envoi du clip, compteur d'identifications restantes, exemples | Tous | **V1** |
| **Résultat d'identification** | Titre proposé, niveau de confiance, alternatives, bouton « ce n'est pas le bon film » | Tous | **V1** |
| **Fiche d'un titre** | Informations, distribution, bande-annonce, où regarder, titres similaires, ajout à la liste | Tous | **V1** |
| **Inscription et connexion** | Formulaires email et Google, mot de passe oublié | Visiteur | **V1** |
| **Profil et paramètres** | Informations du compte, suppression du compte, export des données | Utilisateurs | **V1** |
| **Historique et liste de suivi** | 50 dernières identifications, titres enregistrés | Utilisateurs | **V1** |
| **Tarifs et abonnement** | Comparaison gratuit et premium, paiement, gestion de l'abonnement, factures | Utilisateurs | **V1** |
| **Pages légales** | Conditions d'utilisation, politique de confidentialité, mentions légales, mentions TMDB | Tous | **V1** |
| **Back-office** | Indicateurs, utilisateurs, signalements, abonnements, plafond de dépense IA | Administrateur | **V1** |
| **Application mobile iOS et Android** | Identification depuis le téléphone, notifications | Utilisateurs | **V2** |
| **Espace communautaire** | Profils publics, avis, listes, discussions | Utilisateurs | **V2** |
| **Portail B2B et documentation API** | Tendances, clés d'API, documentation, facturation | Client B2B | **V2** |

| **En résumé** La V1 tient en neuf écrans, tous accessibles sur navigateur mobile et ordinateur. Les applications natives, la communauté et le portail B2B sont renvoyés en V2 pour tenir le délai du 31 décembre 2026. |
| --- |

# 8. Périmètre du projet

| **Domaine** | **Inclus en V1 (lancement 31 décembre 2026)** | **Reporté en V2** |
| --- | --- | --- |
| **Identification** | Envoi d'un clip, extraction de 3 à 5 images dans le navigateur, analyse par IA, score de confiance, alternatives, signalement d'erreur, cache des résultats | Identification par lien (YouTube, TikTok, Instagram), enregistrement d'écran, analyse du dialogue audio, modèle propriétaire |
| **Comptes** | Email et Google, confirmation, mot de passe oublié, suppression et export | Connexion Apple et Facebook, double authentification |
| **Fiches et streaming** | Fiche TMDB, bande-annonce, où regarder par pays | Comparaison des prix, alertes de disponibilité, pages acteurs et réalisateurs, épisodes |
| **Suivi** | Historique de 50 entrées, liste de suivi | Statut vu, collections, import Letterboxd et Trakt, export CSV et JSON |
| **Recommandations** | Titres similaires par contenu (genres, distribution, réalisateur) | Filtrage collaboratif, recommandation par humeur, assistant conversationnel |
| **Social** | Partage d'un résultat par lien | Profils, avis, discussions, listes publiques |
| **Monétisation** | Quota gratuit, paywall, abonnement premium, factures | Premium+, Famille, période d'essai, mobile money, parrainage |
| **Plateformes** | Application web adaptée au mobile | Applications iOS et Android, applications TV |
| **B2B** | Aucun (collecte consentie préparée seulement) | Tendances, API, licence de données, marque blanche |
| **Langues** | Français | Dix langues puis davantage |

**Hors périmètre** tant qu'aucune décision n'est prise : hébergement ou lecture de films, reconnaissance de visages, contenus pour adultes, vente de données individuelles.

| **En résumé** Le périmètre V1 est volontairement étroit : un parcours complet de l'identification à l'abonnement, sur le web. Tout élément absent de la colonne V1 est volontairement repoussé et n'est pas un oubli. |
| --- |

# 9. Objectifs principaux et secondaires

## 9.1 Objectifs principaux (90 jours après le lancement)

**Produit fiable**

  - Taux d'identification correcte sur un jeu de test interne de 100 clips → 85 % minimum, 90 % visé

  - Temps de réponse de l'identification → Médiane 5 secondes, 95e percentile 8 secondes

  - Taux d'erreur serveur → Inférieur à 2 %

**Valider la demande**

  - Utilisateurs inscrits → 1 000

  - Rétention à 30 jours → 30 % minimum

**Valider le modèle économique**

  - Conversion gratuit vers premium → 2,5 %, soit environ 25 abonnés

  - Revenu mensuel récurrent correspondant → Environ 75 EUR (25 x 2,99 EUR)

  - Coût IA moyen par identification → 0,02 EUR maximum

**Poser le positionnement**

  - Partenariats avec des créateurs de contenu cinéma francophones → 5 accords

| **En résumé** Ces cibles remplacent celles du premier cahier des charges, qui étaient incohérentes entre elles : 500 utilisateurs actifs avec 2 % de conversion donnent seulement 10 abonnés, soit environ 30 EUR par mois et non 200 EUR. Atteindre 200 EUR par mois demanderait environ 67 abonnés (section 25). |
| --- |

## 9.2 Objectifs secondaires

**Maîtriser le coût d'identification **

-Cache des résultats, plafond de dépense quotidien, comparaison régulière des fournisseurs d'IA

**Constituer un jeu de test**

**-**Rassembler au moins 100 clips représentatifs, avec le titre attendu, pour mesurer la fiabilité avant et après chaque changement

**Collecter le retour des utilisateurs**

**-**Utiliser les signalements d'erreur et un sondage court pour orienter la V2

**Préparer le B2B sans le lancer**

**-**Prévoir dès la V1 un consentement clair et un schéma de données qui permettent une anonymisation future

**Choisir et protéger le nom  **

**-**Vérifier domaine, marque et réseaux sociaux avant la publication

# 10. Contraintes

| **Contrainte** | **Valeur retenue** | **Impact sur le projet** |
| --- | --- | --- |
| **Budget du MVP** | 12 008 USD, soit environ 11 200 EUR (décision produit) | Exclut l'entraînement d'un modèle propre, les applications natives et une infrastructure lourde |
| **Délai** | Début du développement le 1er novembre 2026, lancement le 31 décembre 2026, soit environ 9 semaines | Périmètre V1 étroit, aucune marge en cas de retard (section 24) |
| **Équipe** | Fondateur et 1 à 2 développeurs full-stack, un profil IA à temps partiel à partir de janvier 2027 | Pas de développement parallèle sur plusieurs fronts |
| **Pile technique** | Next.js, Node.js, TypeScript, PostgreSQL, modèle de vision OpenAI (décision produit) | Choix imposé, détaillé en section 16 |
| **Coût de l'IA** | Environ 0,015 EUR par identification selon le document stratégique (non mesuré) | Le quota gratuit de 15 par jour doit être encadré (section 25) |
| **Droits sur les données** | TMDB : licence commerciale nécessaire. YouTube : téléchargement et accès automatisé interdits sauf autorisation | Impose l'identification par envoi de clip en V1 (sections 18 et 25) |
| **Encaissement** | Fondateur basé au Togo. Stripe n'est pas disponible directement au Togo selon des sources secondaires | Entité ou prestataire de paiement à choisir avant le lancement |
| **Protection des données** | RGPD pour les utilisateurs européens, loi togolaise n° 2019-014 pour le traitement depuis le Togo | Consentement, droits des personnes, déclaration à vérifier |

| **En résumé** Quatre contraintes pèsent le plus : le délai de neuf semaines, le budget, les droits sur les contenus et les données, et la solution d'encaissement. Ce sont aussi les points à traiter en premier pour ne pas bloquer le lancement. |
| --- |

# 11. Règles de gestion

| **N°** | **Règle** | **Précision** |
| --- | --- | --- |
| **RG1** | Quota gratuit | 15 identifications par jour pour un compte gratuit, remise à zéro à minuit, heure de Paris. |
| **RG2** | Visiteur sans compte | Proposition : 3 identifications par jour sans compte pour réduire la friction. À valider. |
| **RG3** | Décompte | Une identification n'est décomptée que si un résultat avec une confiance d'au moins 50 % est affiché. |
| **RG4** | Premium | Identifications sans limite quotidienne stricte, avec un plafond d'usage raisonnable (valeur à fixer après mesure) contre les abus. |
| **RG5** | Plafond de dépense IA | Un plafond quotidien de dépense IA suspend les nouvelles identifications et affiche un message d'attente. L'administrateur est alerté. |
| **RG6** | Cache | Un extrait déjà analysé (même empreinte d'images) renvoie le résultat enregistré sans nouvel appel IA, et n'est pas décompté. |
| **RG7** | Fichiers envoyés | Seules les images extraites sont transmises. Elles sont supprimées au plus tard 24 heures après l'analyse, sauf signalement consenti. |
| **RG8** | Signalement d'erreur | Le signalement conserve les images, la proposition et le titre correct éventuel, uniquement avec le consentement de l'utilisateur. |
| **RG9** | Sessions | Une session expire après 30 jours d'inactivité. La déconnexion supprime le jeton. |
| **RG10** | Mot de passe oublié | Le lien de réinitialisation est valable 24 heures et ne sert qu'une fois. |
| **RG11** | Historique | Les 50 dernières identifications sont affichées. Elles sont conservées 2 ans, puis supprimées. |
| **RG12** | Paiement | Aucune donnée de carte n'est stockée par la plateforme. Seul l'identifiant fourni par le prestataire de paiement est conservé. |
| **RG13** | Renouvellement | L'abonnement se renouvelle automatiquement. Un email de rappel est envoyé 3 jours avant. |
| **RG14** | Résiliation | L'accès premium reste actif jusqu'à la fin de la période payée. Les données sont conservées 30 jours après la fin de l'abonnement. |
| **RG15** | Droits des personnes | L'export des données (format JSON) et la suppression du compte sont disponibles dans les paramètres. |
| **RG16** | Erreurs techniques | En cas d'erreur serveur, trois tentatives avec délai croissant, puis un message clair. L'identification échouée n'est pas décomptée. |
| **RG17** | Données B2B | Aucune donnée n'est utilisée pour le B2B sans consentement explicite et anonymisation préalable. |

| **En résumé** Ces règles gouvernent le quota, le paiement, la vie privée et les pannes. Les règles RG2 et RG4 sont des propositions dont les valeurs exactes seront fixées avec les premières mesures d'usage ; toutes les autres reprennent les décisions déjà prises ou les corrigent lorsque les documents se contredisaient. |
| --- |

# 12. Fonctionnalités détaillées

Les fonctionnalités sont classées par module. La priorité **V1** signifie indispensable au lancement, **V2** signifie prévue dans une version ultérieure. Le document stratégique utilisait trois niveaux (V1, V2, V3) : le niveau V3 est fusionné dans V2 conformément à la consigne de ne retenir que deux niveaux.

## 12.1 Identification vidéo

Module central : il transforme un clip en un titre proposé avec un niveau de confiance.

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Envoi d'un clip** | L'utilisateur glisse ou sélectionne un fichier vidéo court (MP4, MOV, WebM, 60 secondes et 50 Mo maximum). Le navigateur extrait lui-même 3 à 5 images représentatives et ne transmet que ces images au serveur. | **V1** |
| **Contrôle de qualité des images** | Écarte les images noires, floues ou quasi identiques avant l'envoi. Si moins de 2 images sont exploitables, demande un autre clip. | **V1** |
| **Analyse par IA** | Le serveur envoie les images au modèle de vision avec une consigne précise : titre, année, type (film, série, animé), épisode si possible, niveau de confiance de 0 à 100. | **V1** |
| **Rapprochement avec la base de métadonnées** | Le titre proposé est recherché dans TMDB. Une absence de correspondance baisse la confiance. Le résultat porte l'identifiant TMDB. | **V1** |
| **Affichage du résultat** | Titre principal et 3 alternatives, confiance en pourcentage, affiche, année et synopsis court, bouton « ce n'est pas le bon film ». | **V1** |
| **Signalement d'erreur** | Enregistre, avec consentement, les images, la proposition et le titre correct indiqué. Alimente le jeu de test. | **V1** |
| **Cache des résultats** | Une empreinte des images évite de relancer l'analyse sur un extrait déjà traité et réduit le coût. | **V1** |
| **Identification par lien** | Analyse à partir d'un lien YouTube (titre, description, vignette via l'API officielle) puis TikTok et Instagram. Soumise à validation juridique (section 18). | **V2** |
| **Enregistrement d'écran ou de caméra** | Identification d'une scène à partir d'une capture directe depuis le téléphone. | **V2** |
| **Analyse du dialogue** | Transcription audio du clip et rapprochement avec les dialogues de scènes connues. | **V2** |
| **Modèle propriétaire de scènes** | Remplace progressivement le modèle tiers par un modèle entraîné (section 15). | **V2** |

| **En résumé** En V1, le navigateur fait le travail lourd : seules quelques images partent vers le serveur. Cela réduit la bande passante, le coût et les risques juridiques, et rend l'usage possible sur connexion lente. |
| --- |

## 12.2 Fiche titre et métadonnées

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Fiche complète** | Titre, année, durée, genres, synopsis, note, affiche, type (film, série, animé). | **V1** |
| **Distribution et équipe** | Principaux acteurs, réalisateur, scénariste, avec photo. | **V1** |
| **Bandes-annonces** | Lecture de la bande-annonce officielle intégrée à la fiche. | **V1** |
| **Titres similaires** | Liste de 5 à 10 titres proches, avec affiche et genres. | **V1** |
| **Mentions de source** | Mention obligatoire de TMDB dans la section « À propos » et dans les pages légales. | **V1** |
| **Séries : saisons et épisodes** | Détail par saison et par épisode, épisode identifié si possible. | **V2** |
| **Pages personnes** | Page par acteur ou réalisateur avec filmographie. | **V2** |
| **Autres catégories** | Documentaires, courts métrages et contenus spécialisés (animés avec sources dédiées). | **V2** |

| **En résumé** La fiche est la récompense de l'identification : elle doit être complète, rapide et conforme aux conditions de TMDB. |
| --- |

## 12.3 Où regarder

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Disponibilité par pays** | Liste des services de streaming pour le pays de l'utilisateur, avec le type d'accès (abonnement, location, achat). | **V1** |
| **Liens vers les services** | Bouton qui ouvre le titre sur le service choisi lorsque le lien est connu. | **V1** |
| **Comparaison des prix** | Prix de location et d'achat par service. | **V2** |
| **Alertes de disponibilité** | Notification lorsqu'un titre de la liste de suivi arrive sur un service choisi. | **V2** |

| **En résumé** L'information « où regarder » est achetée à un fournisseur spécialisé plutôt que reconstruite : c'est plus rapide et plus fiable. |
| --- |

## 12.4 Comptes et authentification

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Inscription par email** | Email et mot de passe (8 caractères minimum), confirmation par lien. | **V1** |
| **Connexion avec Google** | Bouton de connexion Google, récupération du nom et de l'adresse email. | **V1** |
| **Mot de passe oublié** | Lien de réinitialisation valable 24 heures, à usage unique. | **V1** |
| **Profil** | Nom, photo, date d'inscription, modification du nom et de la photo. | **V1** |
| **Suppression et export** | Suppression définitive du compte et export des données en JSON (droits RGPD). | **V1** |
| **Connexion Apple et Facebook** | Fournisseurs de connexion supplémentaires. | **V2** |
| **Double authentification** | Code à usage unique par application d'authentification. | **V2** |
| **Préférences** | Langue, thème clair ou sombre, notifications. | **V2** |

| **En résumé** La V1 propose deux modes de connexion courants et les droits sur les données dès le départ, ce qui évite de les ajouter dans l'urgence plus tard. |
| --- |

## 12.5 Historique, liste de suivi et collections

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Historique** | Les 50 dernières identifications avec date, titre et confiance. Un clic rouvre la fiche. | **V1** |
| **Liste de suivi** | Ajouter ou retirer un titre. Maximum 100 titres en accès gratuit, illimité en premium. | **V1** |
| **Partage d'un résultat** | Lien public vers la fiche du titre identifié, pour partager sur les réseaux. | **V1** |
| **Statut vu et à voir** | Marquer un titre comme vu et le noter. | **V2** |
| **Collections** | Listes personnalisées, publiques ou privées. | **V2** |
| **Import** | Import depuis Letterboxd et Trakt. | **V2** |
| **Export** | Export de la liste en CSV ou JSON (Premium+). | **V2** |

| **En résumé** L'historique et la liste de suivi donnent une raison de revenir. Le partage par lien est peu coûteux et soutient la croissance par bouche-à-oreille. |
| --- |

## 12.6 Recommandations

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Titres similaires** | Suggestions fondées sur les genres, la distribution et le réalisateur du titre identifié (via TMDB). | **V1** |
| **Explication de la suggestion** | Mention courte du motif, par exemple « même réalisateur » ou « même genre ». | **V1** |
| **Filtres** | Filtrer par genre, année et type (film, série, animé). | **V2** |
| **Filtrage collaboratif** | Suggestions fondées sur le comportement d'utilisateurs aux goûts proches. | **V2** |
| **Recommandation par humeur** | Suggestions selon l'humeur ou le contexte indiqué. | **V2** |
| **Assistant de découverte** | Conversation pour affiner une recherche (« un thriller comme ce film, mais plus sombre »). | **V2** |

| **En résumé** La V1 se contente de suggestions simples et explicables. Les recommandations personnalisées demandent des données d'usage et viennent donc après le lancement. |
| --- |

## 12.7 Communauté

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Profils publics** | Page de profil avec listes et activité. | **V2** |
| **Notes et avis** | Noter un titre et écrire un avis. | **V2** |
| **Discussions** | Commentaires et fils de discussion par titre. | **V2** |
| **Listes publiques** | Créer, partager et suivre des listes. | **V2** |
| **Suivi d'utilisateurs** | S'abonner à l'activité d'autres cinéphiles. | **V2** |
| **Modération** | Signalement, masquage et sanction des contenus abusifs. | **V2** |

| **En résumé** Tout le module communauté est en V2 : il demande de la modération et une masse d'utilisateurs avant d'avoir de la valeur. |
| --- |

## 12.8 Monétisation

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Quota gratuit** | 15 identifications par jour, compteur visible en permanence. | **V1** |
| **Paywall** | Au-delà du quota, message invitant à passer en premium, sans bloquer la consultation des fiches. | **V1** |
| **Abonnement premium** | 2,99 EUR par mois ou 24,99 EUR par an. | **V1** |
| **Paiement par carte** | Paiement sécurisé par un prestataire, sans stockage de données de carte. | **V1** |
| **Gestion de l'abonnement** | Plan actif, date de renouvellement, historique des paiements, résiliation. | **V1** |
| **Reçus et factures** | Envoi automatique par email après chaque paiement. | **V1** |
| **Période d'essai** | Essai gratuit à l'inscription (7 jours proposés dans le premier cahier des charges). | **V2** |
| **Mobile money** | Paiement par T-Money, Flooz ou équivalents pour l'Afrique francophone. | **V2** |
| **Offres Premium+ et Famille** | Premium+ à 9,99 EUR par mois, Famille à 14,99 EUR par mois pour 4 profils. | **V2** |
| **Parrainage et codes promo** | Avantages pour les utilisateurs qui invitent d'autres personnes. | **V2** |

| **En résumé** La V1 permet de vendre un seul abonnement de façon propre. Les autres offres et le paiement par mobile money viennent une fois la demande confirmée. |
| --- |

## 12.9 Administration et pilotage

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Tableau de bord** | Utilisateurs, identifications par jour, taux de réussite, coût IA, revenus. | **V1** |
| **Gestion des utilisateurs** | Recherche, suspension, suppression d'un compte. | **V1** |
| **Revue des signalements** | Liste des identifications signalées avec images et correction proposée. | **V1** |
| **Gestion des abonnements** | Consultation et correction manuelle d'un abonnement. | **V1** |
| **Plafond de dépense IA** | Réglage du plafond quotidien et suspension automatique en cas de dépassement. | **V1** |
| **Journal d'audit** | Trace de toutes les actions d'administration. | **V1** |
| **Gestion des clés B2B** | Création, limite et révocation des clés d'API clients. | **V2** |
| **Modération communautaire** | Outils de traitement des contenus signalés. | **V2** |

| **En résumé** Le plafond de dépense IA est une protection essentielle : sans lui, une hausse soudaine d'usage ou un abus peut coûter plus cher que les revenus. |
| --- |

## 12.10 Données et analytique B2B

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Tendances agrégées** | Tableau de bord des titres les plus recherchés, par pays et par période, sans donnée personnelle. | **V2** |
| **API de données** | Accès par clé aux tendances et signaux de découverte. | **V2** |
| **Licence de données anonymisées** | Fourniture de jeux de données historiques sous contrat. | **V2** |
| **Recommandation en marque blanche** | Moteur de recommandation intégrable dans l'application d'un partenaire. | **V2** |
| **Consentement et anonymisation** | Recueil du consentement, suppression des identifiants, seuils minimaux d'agrégation. | **V2** |

| **En résumé** Le B2B est une hypothèse de revenu, pas un acquis. Il ne démarre qu'avec un volume suffisant d'utilisateurs et un cadre juridique validé. |
| --- |

## 12.11 Notifications et emails

| **Fonctionnalité** | **Description détaillée** | **Priorité** |
| --- | --- | --- |
| **Emails transactionnels** | Confirmation d'inscription, réinitialisation, reçu de paiement. | **V1** |
| **Rappel de renouvellement** | Email envoyé 3 jours avant le renouvellement de l'abonnement. | **V1** |
| **Notifications push** | Alertes sur mobile (disponibilité, sorties). | **V2** |
| **Centre de notifications** | Liste des alertes dans l'application. | **V2** |
| **Lettre d'information** | Sélection hebdomadaire de titres, avec désinscription en un clic. | **V2** |

| **En résumé** En V1, seuls les emails indispensables au fonctionnement sont envoyés. Les messages promotionnels attendent la V2. |
| --- |

# 13. Parcours utilisateurs clés

## 13.1 Identifier un clip

| **Étape** | **Action de l'utilisateur** | **Réponse du système** |
| --- | --- | --- |
| 1 | Ouvre la page d'accueil | Affiche la zone d'envoi, le nombre d'identifications restantes et un exemple. |
| 2 | Sélectionne un clip sur son appareil | Vérifie le format, la durée et la taille, puis affiche « Analyse en cours ». |
| 3 | Attend quelques secondes | Le navigateur extrait les images et ne garde que les meilleures. Une barre de progression s'affiche. |
| 4 | Aucune | Le serveur contrôle le quota, interroge le cache, puis appelle le modèle de vision et TMDB. |
| 5 | Consulte le résultat | Affiche le titre, la confiance et 3 alternatives. Décompte une identification si la confiance dépasse 50 %. |
| 6 | Ouvre la fiche | Affiche les informations, la bande-annonce, où regarder et les titres similaires. |
| 7 | Ajoute le titre à sa liste de suivi | Enregistre le titre (demande de connexion si le visiteur n'a pas de compte). |
| 8 | Signale une erreur si le titre est faux | Propose de choisir le bon titre et demande le consentement pour conserver les images. |

| **En résumé** Le parcours tient en moins de dix secondes quand tout se passe bien, et prévoit une sortie claire en cas d'erreur. |
| --- |

## 13.2 Créer un compte

| **Étape** | **Action de l'utilisateur** | **Réponse du système** |
| --- | --- | --- |
| 1 | Clique sur « S'inscrire » | Affiche le choix entre email et Google, avec lien vers les conditions et la politique de confidentialité. |
| 2a | Saisit son email et un mot de passe | Vérifie le format et la longueur, envoie un email de confirmation. |
| 2b | Choisit Google | Redirige vers Google, puis revient avec l'autorisation. |
| 3 | Confirme son email (cas 2a) | Active le compte et connecte l'utilisateur. |
| 4 | Lit l'écran de bienvenue | Explique l'offre gratuite (15 par jour) et propose de lancer une première identification. |

| **En résumé** L'inscription est volontairement courte. Le consentement aux conditions est recueilli avant la création du compte. |
| --- |

## 13.3 Passer en premium et payer

| **Étape** | **Action de l'utilisateur** | **Réponse du système** |
| --- | --- | --- |
| 1 | Atteint la limite quotidienne | Affiche le message d'invitation au premium sans masquer les fiches déjà consultables. |
| 2 | Ouvre la page des tarifs | Compare gratuit et premium, propose 2,99 EUR par mois ou 24,99 EUR par an. |
| 3 | Choisit une formule | Ouvre la page de paiement sécurisée du prestataire. |
| 4 | Saisit ses informations de paiement | Le prestataire traite le paiement. La plateforme ne reçoit jamais le numéro de carte. |
| 5 | Revient sur la plateforme | Active le premium dès la confirmation du prestataire et envoie le reçu par email. |
| 6 | Plus tard : résilie | Garde l'accès jusqu'à la fin de la période payée et confirme la résiliation par email. |

| **En résumé** Le paiement est entièrement délégué au prestataire. En cas d'échec de confirmation, le compte reste gratuit et un message l'explique. |
| --- |

## 13.4 Exercer ses droits sur ses données

| **Étape** | **Action de l'utilisateur** | **Réponse du système** |
| --- | --- | --- |
| 1 | Ouvre les paramètres du compte | Affiche « Exporter mes données » et « Supprimer mon compte ». |
| 2 | Demande l'export | Génère un fichier JSON avec profil, historique et liste de suivi, envoyé par email sécurisé. |
| 3 | Demande la suppression | Demande une confirmation par mot de passe ou par email. |
| 4 | Confirme | Supprime le compte et les données associées, annule l'abonnement et envoie un email de confirmation. |

| **En résumé** Ce parcours répond aux droits d'accès, de portabilité et d'effacement. Il doit exister dès le lancement. |
| --- |

# 14. Analyse concurrentielle

Cette analyse remplace celles des versions précédentes. Elle repose uniquement sur des sources consultées, chaque information est rattachée à un niveau de fiabilité, et les hypothèses sont signalées comme telles.

## 14.1 Méthode et niveaux de fiabilité

| **Niveau** | **Signification** | **Traitement dans ce document** |
| --- | --- | --- |
| **Vérifié** | Information lue dans une source consultée : site de l'entreprise, magasin d'applications, presse, base de données d'entreprises | Présentée comme un fait, avec sa source |
| **Déclaré** | Affirmation d'une entreprise sur elle-même, impossible à contrôler de l'extérieur | Présentée comme « déclarée », jamais comme acquise |
| **Hypothèse** | Déduction de l'auteur à partir de faits vérifiés (par exemple sur un mécanisme ou un avantage caché) | Signalée par le mot « hypothèse », à valider |
| **Non revérifié** | Information issue des documents précédents ou de connaissances générales, non contrôlée dans cette session | Non utilisée comme fait |

| **Limites de la vérification** Les sources ont été consultées le 1er octobre 2026. Le site de SceneID a été lu directement ; les autres sources ont été consultées sous forme d'extraits obtenus par recherche web. Les liens n'ont pas fait l'objet d'un test automatisé d'accessibilité (navigateur automatisé non disponible ici) et doivent être ouverts une fois avant toute diffusion externe. Les avis d'utilisateurs n'ont pas pu être collectés en volume sur les sites d'avis et forums : seuls ceux visibles dans les extraits sont cités. |
| --- |

## 14.2 Panorama des acteurs

| **Acteur** | **Catégorie** | **Origine** | **Modèle économique** | **Plateformes** | **Fiabilité** |
| --- | --- | --- | --- | --- | --- |
| **Voola** | Identification de clips | Hyderabad, Inde | Abonnement et version gratuite avec publicités discrètes | iOS, Android | Vérifié (S1 à S4) |
| **SceneID** | Identification de clips | Non indiquée | Non publié, recherche d'investisseurs | Application mobile annoncée | Déclaré (S5) |
| **ClipFix** | Identification de clips | Erevan, Arménie (déclaré) | Gratuit avec achats intégrés | iOS | Vérifié et déclaré (S6, S7) |
| **WhatMovieIsThis** | Identification de captures | Non indiquée | Gratuit | Web | Déclaré (S8) |
| **WhatMovie (whatmovie.net)** | Identification de clips | Non indiquée | Non publié | Web | Déclaré (S9) |
| **VidScio** | Identification multi-entrées | Créateur individuel | Non publié | Web, extension de navigateur à l'origine | Déclaré (S10) |
| **What Is This Movie** | Identification par description | Non indiquée | Abonnement à 8,9 USD par mois | Web | Déclaré (S11) |
| **Cight** | Projet open source | Non indiquée | Aucun | Web | Vérifié (S12) |
| **Shazam** | Reconnaissance audio | Racheté par Apple en 2018 | Non précisé dans les sources | Mobile, Mac | Vérifié (S19, S20) |
| **Letterboxd** | Communauté et critiques | Auckland, Nouvelle-Zélande | Gratuit et abonnement payant | Web, iOS, Android, Apple TV | Vérifié (S13 à S15) |
| **JustWatch** | Disponibilité en streaming | Berlin, Allemagne | Régie publicitaire et API pour partenaires | Web, applications | Vérifié (S16 à S18) |

| **En résumé** Le segment de l'identification de clips compte au moins sept acteurs récents, tous petits, et un projet open source qui prouve que la technique de base se reproduit facilement. Les deux grandes références (Letterboxd, JustWatch) ne font pas d'identification. Aucune des sources consultées ne montre un acteur réunissant identification, compte, découverte et offre francophone. |
| --- |

## 14.3 Fiches détaillées

### Voola

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Application éditée par Ravorian LLC, Hyderabad (Inde), sortie début 2025. Dealroom indique un stade « Seed » sans montant public. |
| **Offre et fonctionnalités** | Identification d'un film ou d'une série à partir d'un clip de la galerie, d'une capture ou d'un enregistrement de l'écran. Mode « People » pour reconnaître un acteur. Affiche bandes-annonces, plateformes de streaming et notes agrégées (IMDb, Metacritic, TMDb). Bibliothèque personnelle avec marquage « vu ». |
| **Technologie** | Non publiée. Hypothèse : modèle de vision généraliste couplé à des bases de métadonnées, comme la majorité des applications du segment. |
| **Ce qu'ils font bien et pourquoi** | 1) Présence sur iOS et Android : deux grands magasins d'applications couverts. 2) Le mode « People » élargit le besoin (qui est cet acteur ?). 3) Version gratuite avec publicités discrètes (presse française), qui abaisse la barrière d'essai, et abonnement hebdomadaire, mensuel ou annuel pour monétiser. |
| **Reproches et limites** | Audience encore faible : environ 5 000 téléchargements sur Google Play selon Phonandroid. Pas de dimension communautaire ni de recommandations documentées. Langue de l'interface en français non vérifiée. |
| **Avis et émotions des utilisateurs** | La presse décrit une surprise positive sur l'efficacité, après une méfiance initiale liée au faible nombre de téléchargements. Avis des magasins d'applications non collectés. |
| **Modèle économique** | Abonnements hebdomadaire, mensuel, annuel (Dealroom) et version gratuite avec publicités (Phonandroid). |
| **Facteurs clés de succès** | Simplicité d'usage (un geste pour envoyer le clip), résultat enrichi, couverture spontanée de la presse sur le thème du « Shazam des films ». |
| **Opportunité pour la plateforme** | Aller au-delà du résultat unique : compte, historique, découverte personnalisée, contenus en français, transparence sur la confiance du résultat. |
| **Vérification et sources** | Vérifié par sources secondaires. S1, S2, S3, S4. |

### SceneID

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Site sceneid.run.place. Fondateur : Patrick Olusola, qui se présente comme Lead Cloud Engineer et spécialiste IA, ingénieur AWS certifié avec plus de 5 ans d'expérience. Bouton « Invest Now » : l'entreprise cherche des investisseurs. Pays et date de lancement non publiés. |
| **Offre et fonctionnalités** | Application mobile annoncée : l'utilisateur capture un clip de 10 à 30 secondes et reçoit le titre, la distribution, l'épisode et les liens de streaming. Disponibilité publique de l'application non vérifiée. |
| **Technologie** | Déclarée : empreinte audio-vidéo, appariement de scènes par apprentissage automatique, récupération de métadonnées. Le fondateur affiche des certifications AWS, Kubernetes, Terraform et DevOps. |
| **Ce qu'ils font bien et pourquoi** | Voir l'analyse approfondie ci-dessous (tableau 14.4) : pourquoi la méthode est solide, comment elle a pu être construite, avantages cachés possibles et ce qui reste inconnu. |
| **Reproches et limites** | Aucun avis public trouvé, aucune preuve d'application téléchargeable, ni tarifs, ni modèle économique, ni audience publiés. |
| **Avis et émotions des utilisateurs** | Aucun avis disponible. |
| **Modèle économique** | Non publié. Recherche de financement affichée sur le site. |
| **Facteurs clés de succès** | Positionnement technique crédible (empreintes) et profil d'infrastructure capable de déployer à coût maîtrisé. |
| **Opportunité pour la plateforme** | Occuper le terrain avec un produit réellement disponible, en français, avant qu'un concurrent ait constitué un index de référence. |
| **Vérification et sources** | Déclaré, lu directement sur le site. S5. |

### 14.4 SceneID : analyse approfondie des forces

| **Aspect** | **Constat ou analyse** |
| --- | --- |
| **Ce que l'entreprise a mis en place** | Un site de présentation, une promesse (clip de 10 à 30 secondes, titre et liens de streaming) et une méthode annoncée fondée sur les empreintes audio-vidéo plutôt que sur un modèle de vision généraliste. Le fondateur s'appuie sur un profil cloud (AWS, Kubernetes, Terraform). Niveau : déclaré. |
| **Pourquoi la méthode est solide** | Une empreinte est calculée une fois pour chaque contenu de référence, puis comparée très vite à celle du clip. Le coût par requête reste faible et la réponse rapide, alors qu'un appel à un grand modèle de vision se paie à chaque requête. Une empreinte bien conçue résiste à la compression, au recadrage et au changement de vitesse. Niveau : analyse fondée sur le principe général des empreintes (hypothèse pour SceneID). |
| **Comment elle a pu y arriver** | Un fondateur ingénieur cloud peut déployer et exploiter une infrastructure reproductible (Kubernetes, Terraform) avec peu de moyens, ce qui explique qu'un projet seul puisse afficher une architecture ambitieuse. Niveau : hypothèse. |
| **Le vrai verrou : l'index de référence** | Pour reconnaître un extrait, il faut avoir au préalable calculé l'empreinte de millions de scènes. Cela suppose soit des accords d'accès aux contenus (studios, plateformes), soit une ingestion massive avec un risque juridique. Aucune source publique ne montre que SceneID dispose d'un tel accès : cet avantage est donc potentiel et non démontré. C'est aussi la raison pour laquelle Shazam, adossé à Apple, est difficile à concurrencer sur son terrain. Niveau : analyse. |
| **Avantages cachés possibles** | 1) Coût unitaire très bas à grande échelle. 2) Latence faible. 3) Défendabilité si l'index devient exclusif. 4) Possibilité de vendre l'index ou une API à des professionnels. 5) Un récit technique convaincant pour lever des fonds, ce que le bouton « Invest Now » suggère. Niveau : hypothèses. |
| **Contrats et partenariats** | Aucun contrat, partenariat ou financement public n'a été trouvé. Ce qui pourrait expliquer une position solide, si cela existait : licences d'indexation avec des ayants droit, crédits d'hébergement offerts aux jeunes entreprises par les fournisseurs cloud, appui d'un incubateur. Rien de cela n'est vérifié et il ne faut pas le tenir pour acquis. |
| **Ce que la plateforme en retient** | La logique d'empreinte et d'index propriétaire correspond à notre modèle DeepCine (section 15) : l'avantage durable viendra d'un index de scènes, pas du modèle de vision. Il faut donc planifier dès maintenant comment constituer cet index légalement. Menace actuelle : faible (très jeune, présence publique minimale), à surveiller chaque mois. |

| **En résumé** SceneID n'est pas un concurrent dangereux aujourd'hui, mais il pose la bonne question stratégique : qui possède l'index des scènes ? Son avantage vient de la méthode et du profil technique du fondateur, pas de contrats connus. Notre réponse est de lancer vite avec un modèle tiers, puis de bâtir notre propre index sur des données obtenues légalement. |
| --- |

### ClipFix

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Fiche Gust : Erevan (Arménie), fondé en juin 2023, 8 employés, société non constituée (déclaratif). Application iOS « ClipFix: Movie Shazam » éditée par NextStack LLC. |
| **Offre et fonctionnalités** | Identification du film derrière un clip de réseau social (TikTok, Reels) grâce à un enregistrement d'écran lancé en arrière-plan. Listes classées par humeur (selon un avis). Assistant IA de recommandations (note de version). |
| **Technologie** | Non publiée. Enregistrement d'écran puis analyse par IA, selon la description. |
| **Ce qu'ils font bien et pourquoi** | L'utilisateur n'a pas à quitter l'application sociale : la friction est le premier frein à l'identification, et ClipFix la réduit au minimum. Démonstration simple en deux gestes. |
| **Reproches et limites** | Fiabilité contestée : un avis explique que l'identification a fonctionné un temps puis ne détecte plus rien, l'enregistrement semblant s'arrêter après quelques secondes. Note de 4,1 sur 5, mais sur seulement 12 évaluations. iOS uniquement d'après les sources. |
| **Avis et émotions des utilisateurs** | Frustration et déception de ceux dont l'outil cesse de fonctionner ; satisfaction d'un utilisateur qui apprécie le classement par humeur. |
| **Modèle économique** | Gratuit avec achats intégrés (App Store). |
| **Facteurs clés de succès** | Intégration à l'usage réel, promesse en deux gestes, présence sur un grand magasin d'applications. |
| **Opportunité pour la plateforme** | Fiabilité mesurée et affichée (score, alternatives), parcours simple par envoi de clip, sans dépendre d'une fonction système fragile comme l'enregistrement d'écran. |
| **Vérification et sources** | Vérifié (magasin d'applications) et déclaré (Gust). S6, S7. |

### WhatMovieIsThis

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Site whatmovieisthis.com et page Product Hunt (2 abonnés). Fondateurs non identifiés dans les extraits consultés. |
| **Offre et fonctionnalités** | Gratuit. Envoi d'une capture d'écran de film, série, animé ou K-drama. Reconnaît personnages, costumes, éclairage, texte à l'écran et décor. Renvoie titre, année, résumé sans spoiler, notes IMDb, Rotten Tomatoes et Metacritic, bande-annonce, distribution, réalisateur et streaming dans le pays de l'utilisateur. |
| **Technologie** | Modèle de vision décrit comme propriétaire (déclaré). |
| **Ce qu'ils font bien et pourquoi** | Accès web sans installation ni compte. Résultat très complet en une page : les notes de trois sources et le streaming par pays donnent tout de suite une réponse exploitable. La gratuité facilite l'acquisition. |
| **Reproches et limites** | Fonctionne à partir de captures d'écran plutôt que de clips vidéo. Aucun compte ni historique mentionné. Modèle économique non précisé. Traction visible faible (2 abonnés Product Hunt). |
| **Avis et émotions des utilisateurs** | Aucun avis collecté ; la page d'avis consultée est vide. |
| **Modèle économique** | Gratuit, sans monétisation décrite. |
| **Facteurs clés de succès** | Complétude du résultat, gratuité. Hypothèse : le nom du site reprend la question tapée par les internautes, ce qui favorise le référencement. |
| **Opportunité pour la plateforme** | Compte, historique, recommandations et expérience en français autour d'un résultat tout aussi complet. |
| **Vérification et sources** | Déclaré. S8. Les 5 000 à 20 000 utilisateurs des documents précédents ne sont pas vérifiés. |

### VidScio

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Projet d'un créateur individuel, présenté sur Product Hunt : 0 vote, 1 commentaire, 104e du classement quotidien. Parti d'une extension de navigateur, devenu application web. |
| **Offre et fonctionnalités** | Identification à partir de captures, clips, liens YouTube et Instagram, ou description (intrigue, citation). Conversation pour affiner. Compare plusieurs modèles d'IA pour limiter les erreurs (déclaré). |
| **Technologie** | Plusieurs modèles d'IA comparés (déclaré). |
| **Ce qu'ils font bien et pourquoi** | Gère le cas du clip ambigu grâce à plusieurs types d'entrées et à une boucle de dialogue qui améliore la réponse. La comparaison de modèles vise à réduire les réponses inventées. |
| **Reproches et limites** | Traction très faible, modèle économique non précisé, pas de compte ni de communauté mentionnés. L'identification par lien soulève la question des conditions d'utilisation des plateformes. |
| **Avis et émotions des utilisateurs** | Aucun avis collecté. Le créateur demande lui-même des retours sur la précision. |
| **Modèle économique** | Non publié. |
| **Facteurs clés de succès** | Souplesse des entrées, dialogue d'affinage, attention portée à la fiabilité. |
| **Opportunité pour la plateforme** | Reprendre l'idée du dialogue d'affinage dans l'assistant de la V2, et la vérification croisée dès la V1 (section 15). |
| **Vérification et sources** | Déclaré. S10. |

### Shazam

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Racheté par Apple le 24 septembre 2018 ; plus de 138 millions de dollars levés avant le rachat selon une base de données de startups. |
| **Offre et fonctionnalités** | Reconnaît musiques et, selon la presse, publicités et programmes de télévision grâce à une empreinte audio comparée à une base de référence. Intégré à Siri depuis 2018. Version Mac d'identification des émissions de télévision américaines (plus de 160 chaînes à l'époque). |
| **Technologie** | Empreinte audio comparée à une base de référence. |
| **Ce qu'ils font bien et pourquoi** | Une base de référence énorme et une distribution à l'échelle d'Apple : le produit est installé et intégré au système. C'est le meilleur exemple d'un avantage fondé sur l'index et la distribution. |
| **Reproches et limites** | Hypothèse : n'identifie pas un extrait de film partagé sur un réseau social si l'audio de ce film n'est pas dans sa base. Les sources consultées parlent surtout de chaînes de télévision américaines. |
| **Avis et émotions des utilisateurs** | Non collectés. |
| **Modèle économique** | Non précisé dans les sources consultées. |
| **Facteurs clés de succès** | Base de référence, intégration au système, marque. |
| **Opportunité pour la plateforme** | Se positionner sur le cas non couvert (clips de films et séries partagés en ligne) et sur la relation avec l'utilisateur (compte, découverte). Le document précédent affirmait que Shazam n'avait aucune capacité sur les films : c'était inexact. |
| **Vérification et sources** | Vérifié par presse ancienne. S19, S20. |

### Letterboxd

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | Fondé en 2011 à Auckland par Matthew Buchanan et Karl von Randow. Détenu à 60 % par Tiny depuis 2023 (valorisation de 50 à 60 millions de dollars selon Variety), 40 % aux fondateurs. Plus de 30 millions de membres en 2026 ; environ 40 employés. Une vente est évoquée par la presse (Netflix, Sony, Paramount cités), sans confirmation. |
| **Offre et fonctionnalités** | Journal de visionnage, notes, critiques, listes, liste de suivi et suivi des autres membres. Web, iOS, Android, Apple TV. Abonnement payant à bas prix pour des fonctions supplémentaires, service de location « video store » récent. L'ajout des séries télévisées a été annoncé lors de l'acquisition (état actuel à vérifier). |
| **Technologie** | Non détaillée dans les sources consultées. S'appuie sur la base TMDB pour ses données de films. |
| **Ce qu'ils font bien et pourquoi** | Pourquoi : une communauté très attachée et une identité forte. Comment : petite équipe focalisée, conception soignée, actionnaire qui laisse l'autonomie aux fondateurs (« pas de pression pour revendre en trois à cinq ans » selon Tiny). Résultat : passage de 10 à plus de 30 millions de membres entre 2023 et 2026. Avantage caché : l'effet de réseau (listes, critiques, abonnements entre membres) est très difficile à copier. |
| **Reproches et limites** | Pas d'identification de clip. Les utilisateurs craignent qu'un rachat par un grand groupe nuise à l'indépendance éditoriale. |
| **Avis et émotions des utilisateurs** | Attachement fort à l'indépendance de la plateforme ; inquiétude face aux rumeurs de vente. |
| **Modèle économique** | Gratuit et abonnement payant à faible prix, plus location de films. |
| **Facteurs clés de succès** | Communauté, design, indépendance, bouche-à-oreille, usage par des célébrités et réalisateurs pour leur promotion. |
| **Opportunité pour la plateforme** | Complémentarité : une identification et une découverte légères autour d'un compte, et à terme export ou intégration vers Letterboxd. Vigilance : un acquéreur pourrait ajouter l'identification. |
| **Vérification et sources** | Vérifié (encyclopédie, presse, site de l'actionnaire). S13, S14, S15, S30. Les 12 millions d'utilisateurs et l'absence de séries du document précédent sont périmés. |

### JustWatch

| **Critère** | **Analyse** |
| --- | --- |
| **Profil** | JustWatch GmbH, Berlin. Co-fondé en 2014, lancé en 2015 aux États-Unis et en Allemagne. Plus de 40 millions d'utilisateurs mensuels et 139 pays en novembre 2023. Capital de départ apporté par les fondateurs. |
| **Offre et fonctionnalités** | Moteur de recherche de la disponibilité des films et séries sur plus de 100 bibliothèques de vidéo à la demande, avec qualité, prix, achat et location, filtres et listes partageables. |
| **Technologie** | Agrégation de catalogues de services de streaming (méthode exacte non publiée). |
| **Ce qu'ils font bien et pourquoi** | Pourquoi : des données de disponibilité étendues par pays que peu d'acteurs peuvent reproduire. Comment : couverture mondiale construite pays par pays et API utilisée par des partenaires. Avantage caché : la société dispose aussi d'une branche d'achat de médias (JustWatch Media) qui s'appuie sur ses données d'audience pour des clients du divertissement, donc un revenu qui ne dépend pas de l'abonnement des utilisateurs. |
| **Reproches et limites** | Aucune identification de clip, recommandations limitées à des filtres, pas de dimension de découverte personnalisée. |
| **Avis et émotions des utilisateurs** | Avis non collectés. |
| **Modèle économique** | Publicité et achat de médias pour les studios, API vendue aux partenaires. |
| **Facteurs clés de succès** | Exactitude et étendue des données, couverture internationale, monétisation par les professionnels. |
| **Opportunité pour la plateforme** | Confirme que des données d'audience du secteur peuvent se monétiser auprès des studios : appui à notre hypothèse B2B. Nous pouvons aussi acheter des données de disponibilité plutôt que de les reconstruire. |
| **Vérification et sources** | Vérifié (encyclopédie, presse spécialisée, offre d'emploi de la société). S16, S17, S18. Les 60 millions du document précédent ne sont pas vérifiés. |

### 14.5 Autres acteurs observés

| **Acteur** | **Ce qu'il fait** | **Constat utile** | **Fiabilité** |
| --- | --- | --- | --- |
| **What Is This Movie** | Identification par description, citation ou capture ; modèle de langage associé à TMDB | Abonnement à 8,9 USD par mois, soit environ trois fois notre prix. Affirme 86 % de réussite au premier lot de résultats (auto-déclaré). La disposition réelle à payer n'est pas démontrée. | Déclaré (S11) |
| **WhatMovie (whatmovie.net)** | Identification à partir de clips vidéo uniquement, avec bascule pour voir la disponibilité dans d'autres pays | Description rédigée par l'entreprise elle-même sur Trustpilot. Valide l'attente des utilisateurs pour le streaming par pays. | Déclaré (S9) |
| **Cight** | Projet open source : captures, clips et liens, anime via Trace.moe et AniList, où regarder, assistant | Bâti avec React, Firebase, un modèle Gemini et TMDB. Prouve que la couche « modèle de vision plus TMDB » se reproduit en quelques jours : l'avantage ne peut pas venir de la technique de base. Trace.moe et AniList sont des pistes pour les animés. | Vérifié (S12) |
| **Movineder** | Identification par écoute audio du clip, puis indication des services de streaming | Cité par des articles de guides sans source de premier rang. À traiter avec prudence. | Faible (S29) |

### 14.6 Écosystème de données

| **Acteur** | **Rôle** | **Constat** | **Fiabilité** |
| --- | --- | --- | --- |
| **TMDB** | Base communautaire de films et séries, source de nos fiches | L'API est gratuite pour un usage non commercial avec mention obligatoire. Un usage commercial nécessite une licence à demander à TMDB. Notre service payant est commercial. | Vérifié (S21) |
| **Watchmode** | API de disponibilité en streaming par pays | Offre un niveau gratuit de 2 500 requêtes et des plans payants. Candidat pour la fonction « où regarder ». | Vérifié (S23) |
| **IMDb, Trakt, Google Lens, Netflix** | Base de référence, suivi de séries, recherche visuelle générale, service de streaming | Les chiffres d'utilisateurs, de technologies et de capacités du document stratégique ne sont pas repris : non revérifiés dans cette session. | Non revérifié |

## 14.7 Matrice comparative

| **Acteur** | **Clip** | **Web** | **Mobile** | **Compte** | **Reco.** | **Streaming** | **Social** | **B2B** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **La plateforme (cible)** | Oui | Oui | V2 (natif) | Oui | Oui (base) | Oui | V2 | V2 |
| **Voola** | Oui | Inconnu | Oui | Partiel (bibliothèque) | Inconnu | Oui | Inconnu | Inconnu |
| **SceneID** | Oui (déclaré) | Inconnu | Annoncé | Inconnu | Inconnu | Oui (déclaré) | Inconnu | Inconnu |
| **ClipFix** | Oui | Inconnu | iOS | Partiel (listes) | Oui (assistant) | Inconnu | Inconnu | Inconnu |
| **WhatMovieIsThis** | Non (captures) | Oui | Inconnu | Non cité | Non cité | Oui | Non cité | Inconnu |
| **VidScio** | Oui | Oui | Inconnu | Non cité | Partiel (dialogue) | Non cité | Non cité | Non cité |
| **Shazam** | Partiel (audio TV) | Inconnu | Oui | Inconnu | Inconnu | Non cité | Non cité | Inconnu |
| **Letterboxd** | Non | Oui | Oui | Oui | Partiel (listes, avis) | Inconnu | Oui | Inconnu |
| **JustWatch** | Non | Oui | Oui | Partiel (listes) | Partiel (filtres) | Oui | Partiel | Oui |

*« Inconnu » signifie que l'information n'a pas pu être vérifiée. « Non cité » signifie que le point n'apparaît pas dans les sources consultées, ce qui ne prouve pas son absence.*

| **En résumé** Le tableau est volontairement prudent : beaucoup de cases restent « inconnu » car les concurrents publient peu. Ce que l'on peut affirmer, c'est qu'aucune source consultée ne décrit un acteur qui associe identification de clip, compte, recommandations, streaming et offre francophone. Cette combinaison est l'espace à occuper. |
| --- |

## 14.8 Opportunités de différenciation

| **Opportunité** | **Pourquoi elle existe** | **Comment la saisir** | **Phase** |
| --- | --- | --- | --- |
| **Compte, historique et liste autour de l'identification** | WhatMovieIsThis ne mentionne ni compte ni historique ; Voola propose une bibliothèque mais aucune découverte personnalisée documentée | Historique de 50 entrées, liste de suivi et partage dès la V1 | **V1** |
| **Fiabilité mesurée et visible** | Des avis sur ClipFix décrivent des échecs ; VidScio met en avant la comparaison de modèles | Score de confiance, alternatives, signalement et jeu de test suivi dans le temps | **V1** |
| **Expérience francophone native** | Offres surtout anglophones (à nuancer : Voola est relayé par la presse française) | Interface et fiches en français, créateurs francophones, support en français | **V1** |
| **Découverte personnalisée** | Letterboxd est centré sur la critique, JustWatch sur la disponibilité | Recommandations fondées sur l'historique d'identifications et les préférences | **V2** |
| **Données agrégées pour les professionnels** | JustWatch Media montre que les données d'audience du secteur ont une valeur commerciale | Collecte consentie, anonymisation, tableaux de tendances | **V2** |
| **Afrique francophone et mobile money** | Aucun acteur observé ne cible ce marché (vérification non exhaustive) | Paiement mobile money, interface légère pour connexions lentes | **V2** |
| **Index propriétaire de scènes** | SceneID et Shazam montrent que l'index est la vraie barrière | Modèle DeepCine et plan légal de constitution de l'index | **V2** |

| **Ce que nous retenons** La technique de base se copie en quelques jours (Cight). L'avantage durable viendra donc de la combinaison compte, données, communauté, offre francophone et distribution, et non du modèle d'IA. Deux événements sont à surveiller : la vente éventuelle de Letterboxd et l'arrivée possible de l'identification chez un grand acteur. |
| --- |

# 15. Algorithmes et technologies propriétaires

Chaque élément ci-dessous est présenté avec son rôle, le problème qu'il résout, la façon dont il intervient dans la solution, sa valeur ajoutée et ses limites. Le terme « propriétaire » désigne ici ce que la plateforme construit et contrôle (pipeline, consigne, scores, données), pas le modèle d'IA tiers lui-même.

## 15.1 VisionMatch Express

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Identifier le film ou la série à partir de 3 à 5 images extraites d'un clip. |
| **Problème résolu** | L'utilisateur ne connaît pas le titre ; la recherche manuelle échoue ou prend plusieurs minutes. |
| **Intervention dans la solution** | Premier maillon du parcours : reçoit les images, interroge le modèle de vision avec une consigne spécialisée, rapproche la réponse de TMDB et produit un résultat avec un score de confiance et des alternatives. |
| **Valeur ajoutée** | Pour l'utilisateur : une réponse en quelques secondes. Pour la plateforme : un point d'entrée simple, mesurable et amélioré par les signalements. |
| **Limites et précautions** | Le modèle de vision est un service tiers que n'importe quel concurrent peut utiliser. L'avantage vient du pipeline, de la consigne, du score, du cache et des corrections accumulées. Les chiffres du document stratégique (90 % de précision, moins de 2 secondes, 0,015 EUR par appel) sont des objectifs non mesurés, à tester sur 100 clips. L'avantage de 2 à 3 ans annoncé est une hypothèse. |
| **Priorité** | V1 |

## 15.2 Score de confiance et vérification croisée

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Mesurer la fiabilité d'un résultat avant de l'afficher. |
| **Problème résolu** | Un modèle de vision peut répondre avec assurance à tort, ce qui détruit la confiance de l'utilisateur. |
| **Intervention dans la solution** | Combine la confiance annoncée par le modèle, l'existence du titre dans TMDB, la cohérence entre année et type, et si possible l'accord de deux analyses. Décide d'afficher, d'afficher avec alternatives, ou de demander un autre clip. |
| **Valeur ajoutée** | L'utilisateur voit le niveau de confiance ; la plateforme évite d'afficher une réponse douteuse et ne décompte pas les échecs. |
| **Limites et précautions** | Les poids du score doivent être calibrés sur le jeu de test. Une deuxième analyse augmente le coût. |
| **Priorité** | V1 |

## 15.3 Cache d'extraits

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Réutiliser un résultat déjà obtenu pour un extrait identique ou très proche. |
| **Problème résolu** | Les clips viraux sont envoyés des milliers de fois : relancer l'IA à chaque fois coûte cher et ralentit la réponse. |
| **Intervention dans la solution** | Calcule une empreinte des images, la compare aux résultats validés et renvoie la réponse immédiatement. |
| **Valeur ajoutée** | Coût réduit, réponse instantanée, réutilisation des corrections validées par les signalements. |
| **Limites et précautions** | Le seuil de ressemblance est à régler pour éviter les faux rapprochements. Seuls l'empreinte et le résultat sont conservés, pas les images (règle RG7). |
| **Priorité** | V1 |

## 15.4 Moteur de recommandations

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Suggérer des titres après une identification, puis selon les goûts de l'utilisateur. |
| **Problème résolu** | Netflix et les autres services proposent surtout des listes populaires ou limitées à leur catalogue ; l'utilisateur veut du sur-mesure. |
| **Intervention dans la solution** | En V1, interroge TMDB (genres, distribution, réalisateur), classe par similarité et popularité, explique le motif. En V2, ajoute le filtrage collaboratif (bibliothèque LightFM citée dans le document stratégique) et l'humeur. |
| **Valeur ajoutée** | Découverte plus pertinente, donc plus de retours sur la plateforme. |
| **Limites et précautions** | Sans historique, tous les utilisateurs reçoivent les mêmes suggestions pour un titre (démarrage à froid). La qualité dépend de TMDB. |
| **Priorité** | V1 pour la version de base, V2 pour la version personnalisée |

## 15.5 VisionMatch DeepCine

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Modèle propriétaire de reconnaissance de scènes, destiné à remplacer progressivement le modèle tiers. |
| **Problème résolu** | Dépendance au coût, à la latence et aux conditions d'un fournisseur ; absence d'avantage durable. |
| **Intervention dans la solution** | Trois piliers : un réseau de vision (ResNet-50 affiné sur environ 500 000 scènes), la transcription du dialogue (Whisper) rapprochée d'empreintes de scènes, et un graphe de connaissances (Neo4j) qui relie acteurs, réalisateurs, lieux et époques. Express reste en secours. |
| **Valeur ajoutée** | Précision visée de 99 %, délai inférieur à 500 ms, coût visé de 0,008 EUR par requête, et surtout un index de scènes qui s'enrichit avec les utilisateurs. |
| **Limites et précautions** | Coût estimé à 305 000 EUR sur 18 mois (données 80 000, ingénieurs 180 000, infrastructure 45 000), non validé et hors budget MVP. Exige des données d'entraînement obtenues légalement (droits d'auteur sur les images de films) et un financement externe. Les cibles de performance et l'avantage de 5 ans sont des hypothèses. À lancer seulement après preuve de la demande. |
| **Priorité** | V2 |

## 15.6 Données comportementales anonymisées

| **Aspect** | **Description** |
| --- | --- |
| **Rôle** | Transformer l'usage de la plateforme en indicateurs agrégés pour les studios et plateformes. |
| **Problème résolu** | Les professionnels voient mal comment leurs titres sont découverts hors de leurs services (hypothèse non validée). |
| **Intervention dans la solution** | Collecte consentie d'événements (titres identifiés, pays, période), anonymisation, agrégation avec seuil minimal, puis tableau de bord ou API. |
| **Valeur ajoutée** | Second revenu et argument de vente. L'exemple de JustWatch Media montre qu'une audience du secteur peut se monétiser. |
| **Limites et précautions** | Nécessite un volume d'utilisateurs, un consentement explicite, une base légale (RGPD et loi togolaise) et une validation par des clients potentiels, qu'aucun document source ne mentionne à ce jour. |
| **Priorité** | V2 |

| **En résumé** Seuls trois éléments sont construits pour le lancement : le pipeline Express, le score de confiance et le cache. DeepCine et les données B2B sont des paris de la V2, conditionnés au financement, aux données légales et à la demande. |
| --- |

# 16. Exigences techniques

Les technologies ci-dessous respectent la décision produit (Next.js, Node.js, TypeScript, PostgreSQL, modèle de vision OpenAI) et l'adaptent à une équipe de 1 à 2 développeurs, à neuf semaines de travail et à un budget de 12 008 USD.

| **Couche** | **Technologie recommandée** | **Pourquoi ce choix** | **Comment la mettre en oeuvre** |
| --- | --- | --- | --- |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui | Pages rapides et bien référencées pour les fiches de titres, déploiement simple, typage qui réduit les erreurs, composants accessibles qui accélèrent l'interface. | Application Next.js hébergée sur Vercel, thème aux couleurs de la marque. Extraction des 3 à 5 images du clip dans le navigateur avec l'API Canvas, sans envoyer la vidéo. |
| **Backend** | Node.js 20 et TypeScript, routes API de Next.js en V1 | Une seule base de code pour une petite équipe. Un service séparé ne se justifie que si l'analyse dépasse les limites de durée des fonctions serverless. | Routes pour l'identification, les fiches, la liste de suivi et la facturation. Validation des entrées par schéma. Vérifier dans la documentation de l'hébergeur les limites de taille et de durée des requêtes. |
| **Base de données** | PostgreSQL 15 géré (par exemple Supabase) | Base relationnelle fiable pour comptes, abonnements et historiques, conforme à la décision PostgreSQL, sans serveur à administrer. | Tables : utilisateurs, identifications, éléments de liste, abonnements, signalements, journal d'audit. Migrations versionnées, un seul rôle applicatif. |
| **Cache et quotas** | Redis géré (par exemple Upstash) | Compteurs de quota rapides, limitation de débit et cache des résultats. Optionnel dans le premier cahier des charges, il devient nécessaire avec le quota de 15 par jour. | Clé par utilisateur et par jour, expiration à minuit (heure de Paris). Cache par empreinte d'images. |
| **Hébergement** | Vercel pour le web, services gérés pour le reste | Déploiement continu, certificats automatiques, aucune administration de serveur. | Environnements préproduction et production, variables d'environnement séparées. Kubernetes écarté en V1. |
| **Stockage de fichiers** | Stockage objet (Supabase Storage, Cloudflare R2 ou équivalent) | Conserver quelques images temporaires et les signalements sans alourdir la base. | Envoi direct par URL signée, accès privé, suppression automatique après 24 heures. |
| **Reconnaissance par IA** | Modèle de vision OpenAI via API, derrière une couche d'abstraction | Décision produit. Meilleure précision disponible sans entraînement. La couche d'abstraction permet de changer de fournisseur. | Consigne versionnée, réponse en JSON strict (titre, année, type, confiance), délai maximal, plafond de dépense, jeu de test automatique avant tout changement. |
| **Métadonnées** | TMDB | Référence très riche (affiches, distribution, titres similaires). Gratuite en non commercial uniquement. | Demander la licence commerciale avant le lancement. Mettre les réponses en cache dans le respect des conditions. Afficher la mention obligatoire. |
| **Où regarder** | API Watchmode ou JustWatch | Données de disponibilité par pays impossibles à reconstruire à ce coût. | Tester avec le niveau gratuit, mettre en cache, passer à un plan payant avant le lancement si le volume l'exige. |
| **Paiement par carte** | Prestataire d'abonnement : Stripe si l'entité est éligible, sinon alternative | Abonnement récurrent, factures, conformité des cartes déléguée. Stripe n'est pas disponible directement au Togo selon des sources secondaires (section 25). | Page de paiement hébergée, webhooks signés pour activer le premium, aucun numéro de carte côté plateforme. Choisir l'entité et le prestataire avant le sprint 3. |
| **Paiement mobile money** | Agrégateur couvrant le Togo (V2) | T-Money, Flooz et équivalents sont le moyen de paiement naturel de l'Afrique francophone. | Comparer la couverture, les frais et les délais de plusieurs agrégateurs, à vérifier auprès de chacun. |
| **Génération de PDF** | Reçus fournis par le prestataire de paiement en V1 | Évite un composant à maintenir pour un besoin couvert. | En V2, si des factures personnalisées sont nécessaires, génération côté serveur. |
| **Emails transactionnels** | Resend, Postmark ou SendGrid | Bonne délivrabilité, modèles, suivi des rebonds. | Domaine d'envoi authentifié (SPF, DKIM, DMARC), modèles en français, relance en cas d'échec. |
| **Notifications** | Email en V1, notifications push en V2 | Les emails suffisent au lancement. | Push web ou mobile en V2, avec consentement. |
| **Analytique** | Plausible ou PostHog | Mesure respectueuse de la vie privée, sans données personnelles inutiles. | Événements : identification, résultat, ajout à la liste, passage au premium. |
| **Monitoring** | Sentry et surveillance externe de disponibilité | Alertes immédiates sur les erreurs et les pannes. | Alertes par email, suivi du coût IA, journaux conservés 30 jours. |
| **Authentification** | Auth.js ou service géré (par exemple Supabase Auth) | Email et Google, sessions et protection CSRF intégrées, aucun développement sur mesure de la sécurité des mots de passe. | Cookies sécurisés, limitation des tentatives, confirmation d'email. |
| **CI/CD** | GitHub Actions | Tests et déploiements automatiques, indispensables pour tenir neuf semaines. | Pipeline : contrôle de qualité du code, tests, jeu de test d'identification, déploiement en préproduction puis en production. |
| **Gestion des erreurs** | Gestion centralisée avec messages clairs | Éviter les écrans vides et ne pas décompter une identification échouée. | Codes d'erreur normalisés, trois tentatives avec délai croissant, mode dégradé si l'IA est indisponible. |
| **Sauvegardes** | Sauvegardes quotidiennes de la base et export hebdomadaire externe | Une perte de données est un risque critique. | Vérifier que le plan choisi inclut les sauvegardes, tester la restauration chaque mois. |

| **En résumé** La pile retenue privilégie la vitesse et le faible coût : Next.js, Vercel et PostgreSQL géré pour livrer en neuf semaines, une couche d'abstraction autour du modèle d'IA pour ne pas être prisonnier d'un fournisseur, et des services spécialisés pour les métadonnées, la disponibilité en streaming et le paiement. Deux points demandent une décision avant le 1er novembre : la licence TMDB et la solution d'encaissement. |
| --- |

## 16.1 Technologies du document stratégique jugées inadaptées au MVP

| **Technologie citée** | **Constat** | **Alternative proposée** |
| --- | --- | --- |
| **Kubernetes (GKE) et GCP** | Coût et complexité disproportionnés pour 1 à 2 développeurs, et incohérent avec un déploiement sur Vercel | Services gérés en V1. À réexaminer pour DeepCine en V2 |
| **NestJS et Express ensemble** | Deux frameworks pour le même rôle | Un seul : routes API de Next.js (ou Express seul) |
| **Elasticsearch** | Inutile quand le catalogue est fourni par TMDB | Recherche TMDB et index PostgreSQL |
| **InfluxDB** | Base spécialisée sans besoin en V1 | Tables PostgreSQL et outil d'analytique |
| **Neo4j** | Utile seulement pour le graphe de connaissances de DeepCine | Reporter en V2 |
| **BigQuery et Datadog** | Coûteux pour les volumes de la V1 | Plausible ou PostHog, et Sentry |
| **WebSocket temps réel** | Aucun besoin en V1 | Reporter en V2 |
| **Connexion Apple et Facebook** | Configuration lourde pour peu de bénéfice au lancement | Email et Google en V1, le reste en V2 |

# 17. Exigences de performance

| **Exigence** | **Cible** | **Méthode de mesure** |
| --- | --- | --- |
| **Chargement de la page d'accueil** | Contenu principal affiché en moins de 2,5 s sur 4G ; moins de 300 Ko de JavaScript compressé au premier chargement | Lighthouse et WebPageTest avec réseau simulé |
| **Connexion lente** | Page utilisable en moins de 6 s en 3G simulée ; envoi total inférieur à 1,5 Mo (images extraites) | WebPageTest profil 3G et test sur téléphone d'entrée de gamme |
| **Temps d'identification** | Médiane de 5 s et 95e percentile de 8 s, du clic au résultat | Mesure côté serveur et journaux |
| **API hors IA** | 95e percentile inférieur à 500 ms | Monitoring applicatif |
| **Fiche d'un titre** | 95e percentile inférieur à 800 ms avec cache | Monitoring applicatif |
| **Disponibilité** | 99,5 % par mois | Surveillance externe de disponibilité |
| **Emails transactionnels** | 95 % envoyés en moins de 60 s | Webhooks du fournisseur d'emails |
| **Activation du premium** | Moins de 30 s après la confirmation du prestataire de paiement | Journaux des webhooks |
| **Reçu de paiement** | Envoyé immédiatement par le prestataire de paiement | Contrôle manuel et alertes d'échec |
| **Utilisateurs simultanés** | 500 sans dégradation en V1, test de charge jusqu'à 2 000 | Test de charge (k6) |
| **Taux d'erreur** | Moins de 1 % des requêtes hors IA ; moins de 2 % des identifications | Sentry et journaux |
| **Précision d'identification** | 85 % minimum sur un jeu de test de 100 clips, 90 % visé | Test automatique avant chaque changement de consigne ou de modèle |
| **Coût d'identification** | 0,02 EUR maximum en moyenne | Tableau de bord de coûts |
| **Sauvegarde et restauration** | Perte maximale de 24 h, restauration en moins de 4 h | Test mensuel de restauration |

| **En résumé** Les cibles tiennent compte de deux réalités : un modèle de vision distant ne répond pas en moins de 2 secondes de façon fiable (objectif du document stratégique, abandonné), et une partie du public visé utilise des connexions lentes. Le délai de 5 secondes est une médiane réaliste, à confirmer par des mesures avant le lancement. |
| --- |

# 18. Sécurité et conformité

## 18.1 Exigences de sécurité

| **Exigence** | **Détail** | **Mise en oeuvre recommandée** | **Priorité** |
| --- | --- | --- | --- |
| **HTTPS et TLS** | Tout le trafic est chiffré | Certificats automatiques de l'hébergeur, redirection forcée vers HTTPS, TLS 1.2 minimum, en-tête HSTS | **V1** |
| **Mots de passe** | Jamais stockés en clair | Hachage fort (argon2 ou bcrypt) délégué au service d'authentification, 8 caractères minimum | **V1** |
| **Authentification forte** | Seconde étape de connexion | Double authentification par application en V2 ; connexion Google en V1 | **V2** |
| **Sessions** | Durée limitée, cookies protégés | Cookies HttpOnly, Secure et SameSite, expiration après 30 jours d'inactivité, révocation à la déconnexion | **V1** |
| **Contrôle d'accès par rôle** | Utilisateur, administrateur, client B2B | Vérification côté serveur à chaque requête, règles d'accès au niveau de la base | **V1** |
| **Injections** | Aucune requête construite par concaténation | Requêtes paramétrées et validation de schéma | **V1** |
| **CSRF et XSS** | Formulaires et affichages protégés | Jetons CSRF, cookies SameSite, politique de sécurité de contenu, échappement des contenus | **V1** |
| **Limitation de débit** | Contre la force brute et les abus | Limite par adresse IP et par compte (par exemple 20 tentatives de connexion par heure), plus le plafond de dépense IA | **V1** |
| **Validation des données** | Toute entrée est vérifiée | Schémas de validation côté serveur : type, taille, format ; rejet des clips non conformes | **V1** |
| **Sécurité des fichiers envoyés** | Images non fiables | Contrôle du type réel, taille maximale, stockage privé, suppression à 24 h, aucun traitement exécutable | **V1** |
| **Journalisation** | Traçabilité sans données sensibles | Journal d'audit des actions d'administration, journaux d'authentification, aucune image ni mot de passe dans les journaux | **V1** |
| **Sauvegardes** | Reprise après incident | Sauvegarde quotidienne, copie externe hebdomadaire, test de restauration mensuel | **V1** |
| **Chiffrement des données** | Au repos et en transit | Chiffrement géré par les fournisseurs, chiffrement applicatif des champs les plus sensibles si nécessaire | **V1** |
| **Transactions financières** | Aucune donnée de carte stockée | Page de paiement hébergée par le prestataire, webhooks signés, traitement sans doublon | **V1** |
| **Secrets et variables d'environnement** | Clés d'API et identifiants | Variables par environnement, jamais dans le code, rotation annuelle, accès restreint | **V1** |
| **Conservation des données** | Durées limitées | Historique 2 ans, images 24 h, compte supprimé effacé sous 30 jours | **V1** |
| **Droits des utilisateurs** | Accès, rectification, opposition, effacement, portabilité | Export JSON et suppression en libre-service, adresse de contact dédiée | **V1** |
| **Dépendances logicielles** | Failles connues | Mises à jour régulières et analyse automatique des dépendances | **V1** |

| **En résumé** La sécurité repose sur des briques éprouvées (services gérés, prestataire de paiement, authentification déléguée) plutôt que sur du développement sur mesure. Presque tout est classé V1 car ces mesures coûtent beaucoup plus cher à ajouter après le lancement. |
| --- |

## 18.2 Cadre réglementaire et contractuel vérifié

| **Texte ou condition** | **Ce que les sources confirment** | **Source** | **Conséquence pour le projet** |
| --- | --- | --- | --- |
| **Loi togolaise n° 2019-014 du 29 octobre 2019 sur la protection des données personnelles** | Encadre la collecte, le traitement, la transmission et le stockage des données. Impose une obligation de déclaration auprès de l'autorité, fixe des principes (consentement, finalité, conservation limitée) et des droits d'accès, d'opposition, d'effacement et de rectification. | S24 | Prévoir consentement, droits des personnes et déclaration. Faire confirmer par un juriste. |
| **Autorité de protection (IPDCP)** | La presse indique que l'instance a lancé officiellement ses activités le 28 mars 2025. Une source commerciale plus ancienne la décrivait comme non établie : les sources divergent et la plus récente est retenue. | S25, S26 | Vérifier directement auprès de l'IPDCP la procédure de déclaration applicable. |
| **RGPD (Union européenne)** | Non revérifié dans cette session. Texte de référence applicable aux utilisateurs situés dans l'Union européenne. | Aucune | Faire valider par un juriste : bases légales, registre des traitements, transferts vers les fournisseurs d'IA. |
| **UEMOA** | Aucune obligation propre à l'UEMOA n'a été vérifiée dans cette session. | Aucune | Ne pas affirmer d'obligation. Demander un avis juridique avant l'expansion en Afrique de l'Ouest. |
| **Conditions de TMDB** | API gratuite pour un usage non commercial avec mention obligatoire. Licence à demander pour un usage commercial. | S21 | Le service étant payant, contacter TMDB avant le lancement. |
| **Conditions de YouTube** | Interdisent de télécharger ou reproduire du contenu et d'y accéder par des moyens automatisés, sauf autorisation expresse. | S22 | Pas d'extraction d'images depuis des liens YouTube en V1. Avis juridique avant la V2. |
| **Disponibilité de Stripe au Togo** | Deux sources commerciales secondaires indiquent que Stripe n'est pas pris en charge directement au Togo et proposent de passer par une société américaine. Non confirmé par la page officielle. | S27, S28 | Vérifier la liste officielle des pays. Prévoir un prestataire ou une entité alternative. |

| **En résumé** Trois points sont vérifiés et contraignants : les droits de TMDB, les conditions de YouTube et la loi togolaise de 2019. Deux autres (RGPD, UEMOA) n'ont pas été vérifiés ici et exigent un avis juridique avant lancement : ce document ne les présente donc pas comme des obligations certaines. |
| --- |

# 19. Intégrations externes

| **Service** | **Usage dans la plateforme** | **Fournisseur** | **Criticité** | **Alternative éventuelle** |
| --- | --- | --- | --- | --- |
| **Reconnaissance par IA** | Identifier le titre à partir des images | OpenAI (vision) | Critique | Google Gemini, Anthropic Claude, modèle propriétaire en V2 |
| **Métadonnées** | Fiches, affiches, distribution, titres similaires | TMDB | Critique | Watchmode, OMDb, IMDb (licence payante) |
| **Où regarder** | Disponibilité par pays | Watchmode ou JustWatch (API) | Haute | Autre fournisseur ou liens génériques |
| **Paiement par abonnement** | Abonnements, factures | Stripe si éligible, sinon prestataire alternatif | Critique | Paddle, Lemon Squeezy, agrégateur local |
| **Mobile money (V2)** | Paiements T-Money, Flooz | Agrégateur à choisir | Haute en V2 | Intégration directe avec les opérateurs |
| **Authentification** | Email et Google | Auth.js ou Supabase Auth, Google | Critique | Clerk, Auth0 |
| **Base de données** | Données applicatives | PostgreSQL géré (Supabase) | Critique | Neon, Railway, Cloud SQL |
| **Cache et quotas** | Compteurs et cache des résultats | Upstash Redis | Haute | Autre Redis géré, quotas en base |
| **Stockage de fichiers** | Images temporaires | Supabase Storage ou Cloudflare R2 | Haute | Google Cloud Storage |
| **Hébergement** | Application web | Vercel | Haute | Netlify, Cloud Run |
| **Emails transactionnels** | Confirmations, reçus | Resend, Postmark ou SendGrid | Haute | Amazon SES, Mailgun |
| **Analytique** | Mesure d'usage | Plausible ou PostHog | Moyenne | Matomo |
| **Monitoring** | Erreurs et disponibilité | Sentry et surveillance externe | Haute | Datadog en V2 |
| **Bandes-annonces** | Lecture dans la fiche | Lecteur intégré YouTube | Moyenne | Vimeo, liens externes |

| **En résumé** Quatre services sont critiques : l'IA, les métadonnées, le paiement et l'authentification. Pour chacun, une alternative est identifiée afin de pouvoir changer de fournisseur sans réécrire la plateforme. |
| --- |

# 20. Compatibilité et accessibilité

## 20.1 Navigateurs et appareils

| **Environnement** | **Versions minimales** | **Statut** |
| --- | --- | --- |
| **Chrome** | 90 et suivantes | Supporté |
| **Firefox** | 88 et suivantes | Supporté |
| **Safari** | 14 et suivantes | Supporté |
| **Edge** | 90 et suivantes | Supporté |
| **Chrome pour Android** | 90 et suivantes | Supporté |
| **Safari pour iOS** | 14 et suivantes | Supporté |

| **Appareil** | **Largeur** | **Comportement** |
| --- | --- | --- |
| **Ordinateur** | 1 280 pixels et plus | Mise en page complète avec navigation latérale |
| **Ordinateur portable** | 1 024 pixels | Mise en page adaptée |
| **Tablette** | 768 pixels | Une colonne, menu repliable |
| **Téléphone** | 320 à 480 pixels | Disposition verticale, boutons adaptés au toucher, envoi du clip depuis la galerie |

## 20.2 Accessibilité (WCAG 2.1, niveau AA)

| **Critère** | **Exigence** | **Vérification** |
| --- | --- | --- |
| **Contraste** | Rapport d'au moins 4,5 pour 1 pour le texte courant | Outil de contraste lors de la conception |
| **Texte alternatif** | Chaque affiche et image informative a un texte alternatif | Audit automatique et revue manuelle |
| **Formulaires** | Libellés explicites, erreurs annoncées clairement | Test avec lecteur d'écran |
| **Navigation au clavier** | Toutes les actions sont accessibles sans souris | Parcours complet au clavier |
| **Lecteurs d'écran** | Le résultat d'identification est annoncé | Test avec NVDA ou VoiceOver |
| **Couleur** | Aucune information portée uniquement par la couleur | Revue de conception |
| **Zoom** | Utilisable jusqu'à 200 % | Test manuel |
| **Taille du texte** | 14 pixels minimum pour le texte courant | Revue de conception |

| **En résumé** La plateforme vise les navigateurs courants des cinq dernières années et le niveau AA des règles d'accessibilité. La compatibilité avec les téléphones et les connexions lentes est traitée comme une exigence de base et non comme une option, notamment pour l'Afrique francophone. |
| --- |

# 21. Modèle économique et projections

## 21.1 Offres pour les utilisateurs (B2C)

| **Offre** | **Prix** | **Contenu** | **Phase** |
| --- | --- | --- | --- |
| **Gratuit** | 0 | 15 identifications par jour, métadonnées de base, liste de suivi de 100 titres, recommandations de base | **V1** |
| **Premium** | 2,99 EUR par mois ou 24,99 EUR par an | Identifications étendues, liste de suivi illimitée, aucune publicité. Les fonctions avancées (prix de streaming, recommandations personnalisées) s'ajoutent à mesure de leur livraison. | **V1** |
| **Premium+** | 9,99 EUR par mois | Tout Premium, fonctions sociales complètes, collections publiques, export, accès anticipé | **V2** |
| **Famille** | 14,99 EUR par mois, 4 profils | Tout Premium, profils séparés, contrôle parental, collections partagées | **V2** |

L'abonnement annuel à 24,99 EUR représente environ 30 % de remise par rapport à 12 mois à 2,99 EUR (35,88 EUR).

## 21.2 Offres pour les professionnels (B2B), hypothèses non validées

| **Offre** | **Prix envisagé** | **Contenu** | **Cibles** |
| --- | --- | --- | --- |
| **API d'analytique comportementale** | 5 000 à 20 000 EUR par mois | Tendances en temps réel, démographie agrégée, signaux de découverte | Studios, plateformes, chaînes |
| **Recommandation en marque blanche** | 50 000 EUR de mise en place puis 5 000 à 15 000 EUR par mois | Moteur de recommandation intégré dans l'application du client | Plateformes sans bonne découverte |
| **Licence de données anonymisées** | 20 000 à 100 000 EUR | Données historiques et tendances par genre et par pays | Investisseurs, agences, studios |

| **En résumé** Les prix B2B sont des hypothèses du document stratégique : aucun client, entretien ni lettre d'intention n'est mentionné dans les documents sources. Ils ne doivent pas être comptés comme des revenus avant une première validation commerciale. |
| --- |

## 21.3 Projections du document stratégique (hypothèses de travail)

| **Indicateur** | **Année 1 (2027)** | **Année 2 (2028)** | **Année 3 (2029)** |
| --- | --- | --- | --- |
| **Utilisateurs actifs** | 22 706 | 85 600 | 202 100 |
| **Taux de conversion premium** | 2,5 % | 3,2 % | 3,8 % |
| **Utilisateurs premium** | 567 | 2 739 | 7 680 |
| **Revenu mensuel moyen par abonné** | 2,99 EUR | 3,50 EUR | 4,20 EUR |
| **Revenus B2C** | 20 388 EUR | 115 038 EUR | 387 072 EUR |
| **Revenus B2B** | 7 554 EUR | 296 172 EUR | 632 718 EUR |
| **Revenus totaux** | 27 942 EUR | 411 210 EUR | 1 019 790 EUR |
| **Coûts directs (API, infrastructure)** | 12 500 EUR | 54 000 EUR | 125 000 EUR |
| **Frais de fonctionnement** | 8 590 EUR | 94 881 EUR | 278 040 EUR |
| **Résultat net** | 6 852 EUR | 262 329 EUR | 616 750 EUR |
| **Marge nette** | 24,5 % | 63,8 % | 60,5 % |

## 21.4 Contrôle de cohérence des projections

| **Vérification** | **Résultat** | **Commentaire** |
| --- | --- | --- |
| **Revenus B2C = abonnés x revenu mensuel x 12** | Année 1 : 20 344 EUR (document : 20 388 EUR). Années 2 et 3 : exact | Écart de 44 EUR en année 1, négligeable |
| **Conversion x utilisateurs = abonnés** | Exact pour les trois années | Calcul correct |
| **Totaux, marge et résultat** | Exacts | Calculs corrects |
| **Résultat cumulé sur 3 ans** | 885 931 EUR (document : 886 931 EUR) | Erreur de 1 000 EUR dans le document |
| **Revenus B2B de l'année 1** | 7 554 EUR prévus en 2027 | Incohérent avec la feuille de route : les premiers clients B2B sont prévus en 2028 |
| **Frais de fonctionnement de l'année 1** | 8 590 EUR | Incohérent avec le budget de l'année 1 qui compte 45 000 EUR de salaires |
| **Utilisateurs de l'année 1** | 22 706 utilisateurs | La feuille de route vise 85 000 utilisateurs fin 2027 |
| **Infrastructure de l'année 1** | Annoncée à environ 1 000 EUR par mois | Le détail du document donne 3 700 EUR par mois hors API |

## 21.5 Test de sensibilité sans revenus B2B

| **Année** | **Revenus B2C** | **Coûts (directs et fonctionnement)** | **Résultat sans B2B** |
| --- | --- | --- | --- |
| **Année 1** | 20 388 EUR | 21 090 EUR | Perte de 702 EUR |
| **Année 2** | 115 038 EUR | 148 881 EUR | Perte de 33 843 EUR |
| **Année 3** | 387 072 EUR | 403 040 EUR | Perte de 15 968 EUR |

| **Ce que montre ce test** Avec les propres hypothèses de coûts du document stratégique, les seuls abonnements ne couvrent pas les dépenses sur les trois années. Le seuil de rentabilité annoncé au mois 9 et les marges de 60 % reposent donc sur des contrats B2B qui ne sont pas démontrés. Il faut présenter ces projections comme un scénario conditionnel et bâtir le plan financier réel sur les abonnements seuls. |
| --- |

**Risque propre au quota gratuit.** Un utilisateur gratuit qui consommerait ses 15 identifications chaque jour coûterait, avec un coût estimé à 0,015 EUR par appel, environ 6,75 EUR par mois, soit plus du double du prix de l'abonnement premium. L'usage moyen sera bien inférieur, mais cette limite rend indispensables le cache, le plafond de dépense quotidien et la mesure du coût par utilisateur actif.

# 22. Planning et feuille de route

## 22.1 Plan de réalisation de la V1

| **Période** | **Contenu** | **Livrable** |
| --- | --- | --- |
| **Avant le 1er novembre** | Décisions bloquantes : nom, entité et solution de paiement, demande de licence TMDB, compte du fournisseur d'IA, liste des 100 clips de test | Décisions écrites, accès aux services ouverts |
| **Semaine 1 et 2 (1er au 14 novembre)** | Fondations : dépôt, intégration continue, authentification, schéma de base, maquettes, extraction des images dans le navigateur | Application vide déployée avec connexion |
| **Semaine 3 et 4 (15 au 28 novembre)** | Pipeline d'identification : appel IA, rapprochement TMDB, score de confiance, cache, jeu de test | Identification de bout en bout mesurée |
| **Semaine 5 et 6 (29 novembre au 12 décembre)** | Fiche titre, où regarder, historique, liste de suivi, quotas, page des tarifs et paiement | Parcours complet jusqu'à l'abonnement |
| **Semaine 7 et 8 (13 au 26 décembre)** | Test sur 100 clips, sécurité, pages légales, back-office, bêta fermée de 20 à 50 testeurs | Version candidate, précision mesurée |
| **27 au 31 décembre** | Gel du périmètre, mise en production, surveillance renforcée | Lancement le 31 décembre 2026 |

| **En résumé** Neuf semaines laissent très peu de marge, et le 31 décembre tombe en période de congés. Il est recommandé de geler le périmètre au 20 décembre, de lancer d'abord auprès d'un groupe restreint (lancement doux) et de refuser tout ajout qui ne figure pas en V1. |
| --- |

## 22.2 Feuille de route après le lancement

| **Phase** | **Période** | **Objectif** | **Contenu clé** | **Cibles du document stratégique** |
| --- | --- | --- | --- | --- |
| **1** | 31 décembre 2026 | Lancement du MVP | Contenu V1 | 1 000 utilisateurs |
| **2** | Premier et deuxième trimestres 2027 | Croissance | Applications iOS et Android, prix de streaming, recommandations enrichies, communauté, 10 langues | 15 000 utilisateurs, 5 000 EUR par mois |
| **3** | Troisième et quatrième trimestres 2027 | IA et échelle | Filtrage collaboratif, humeur, premiers contrats B2B, applications TV, Afrique francophone | 85 000 utilisateurs, 35 000 EUR par mois |
| **4** | 2028 | Apprentissage profond | VisionMatch DeepCine, graphe de connaissances, API B2B | 200 000 utilisateurs |
| **5** | 2029 et après | Expansion | Assistant de découverte, outils pour créateurs, ouverture mondiale | 500 000 utilisateurs |

| **En résumé** Les cibles de la dernière colonne sont celles du document stratégique ; elles ne concordent pas avec son propre modèle financier (22 706 utilisateurs en 2027 contre 85 000 prévus fin 2027). Elles servent de repères d'ambition, pas de prévisions. |
| --- |

# 23. Équipe, budget et financement

| **Poste** | **Rôle** | **Arrivée prévue** |
| --- | --- | --- |
| **Fondateur et PDG (Bankati Bolagbede)** | Vision produit, stratégie, financement, partenariats | En place |
| **1 à 2 ingénieurs full-stack** | Architecture, API, interface web (Node.js, React, PostgreSQL) | Novembre 2026 |
| **Ingénieur IA à temps partiel** | Intégration du modèle de vision, moteur de recommandations | Janvier 2027 |
| **Croissance et marketing à temps partiel** | Acquisition, analyse produit, partenariats avec les créateurs | Février 2027 |
| **Année 2** | Environ 12 personnes : ingénieurs mobiles et web, 2 ingénieurs ML, produit, croissance, DevOps, design | 2028 |

| **Budget de l'année 1 (document stratégique)** | **Montant** |
| --- | --- |
| **Salaires (2 équivalents temps plein)** | 45 000 EUR |
| **Infrastructure** | 12 000 EUR |
| **Marketing et lancement** | 8 000 EUR |
| **Juridique et administratif** | 5 000 EUR |
| **Imprévus** | 5 000 EUR |
| **Total** | 75 000 EUR |

**Financement prévu** : démarrage en autofinancement pendant 6 mois, puis levée de fonds d'amorçage de 500 000 à 1 000 000 EUR au troisième trimestre 2027 si le produit trouve son marché.

| **En résumé** Le budget du MVP (12 008 USD) et le budget annuel de 75 000 EUR ne décrivent pas la même chose. Le MVP ne couvre pas les 45 000 EUR de salaires : soit l'équipe est rémunérée autrement (parts, prestataires, apport du fondateur), soit le budget du MVP est sous-évalué. Cette question doit être tranchée avant le recrutement de novembre. |
| --- |

# 24. Risques et mitigation

| **Risque** | **Probabilité** | **Impact** | **Mitigation** |
| --- | --- | --- | --- |
| **Précision insuffisante de l'identification** | Moyenne | Critique | Jeu de test de 100 clips, confiance affichée, alternatives, vérification TMDB, signalement d'erreur |
| **Coût de l'IA supérieur aux revenus (quota gratuit)** | Haute | Élevé | Cache, plafond quotidien, quota réduit pour les visiteurs, mesure du coût par utilisateur, possibilité de réduire le quota gratuit |
| **Dépendance au fournisseur d'IA** | Moyenne | Élevé | Couche d'abstraction, second fournisseur testé, modèle propriétaire en V2 |
| **Licence TMDB non obtenue** | Moyenne | Élevé | Demande immédiate, plan B avec Watchmode ou OMDb, affichage minimal en attendant |
| **Conditions d'utilisation de YouTube** | Moyenne | Moyen | Envoi de clips uniquement en V1, avis juridique avant les liens |
| **Solution d'encaissement indisponible depuis le Togo** | Haute | Critique | Choisir l'entité et le prestataire avant le sprint 3, prévoir une alternative de revendeur officiel |
| **Retard sur le lancement du 31 décembre** | Haute | Élevé | Périmètre V1 gelé, bêta fermée, lancement doux, refus des ajouts |
| **Produit copiable (un projet open source existe)** | Haute | Moyen | Miser sur les données, la communauté, la distribution et la marque, et sur la vitesse d'exécution |
| **Concurrence (Voola, Letterboxd après une vente éventuelle, Apple et Shazam)** | Moyenne | Élevé | Veille mensuelle, différenciation francophone et par le compte |
| **Non-conformité aux règles de données (RGPD, loi togolaise)** | Moyenne | Élevé | Avis juridique, protection de la vie privée dès la conception, droits des personnes dès la V1 |
| **Faible traction** | Moyenne | Critique | Partenariats avec des créateurs, partage de résultats, itérations rapides |
| **Hypothèse B2B non validée** | Haute | Élevé | Entretiens avec une dizaine de professionnels avant tout investissement, ne pas compter le B2B dans le budget |
| **Perte ou fuite de données** | Faible | Critique | Sauvegardes, chiffrement, accès minimal, journalisation |
| **Difficulté de recrutement** | Moyenne | Élevé | Prestataires, intéressement au capital, recrutement à distance en Europe |
| **Coût de DeepCine (environ 305 000 EUR)** | Haute si lancé trop tôt | Élevé | Conditionner le lancement à un financement et à la preuve de la demande |

| **En résumé** Trois risques peuvent bloquer le lancement lui-même : la solution d'encaissement, le délai de neuf semaines et la licence TMDB. Deux risques menacent la viabilité : le coût du quota gratuit et l'hypothèse B2B. Tous ont une action de mitigation à engager dès le mois de novembre. |
| --- |

# 25. Incohérences relevées et arbitrages

Les trois documents sources et les versions précédentes se contredisent sur plusieurs points. Le tableau indique chaque écart et la décision retenue dans ce document. En cas de désaccord sur un arbitrage, c'est la colonne de droite qu'il faut modifier.

| **Sujet** | **Constat dans les documents sources** | **Arbitrage retenu** |
| --- | --- | --- |
| **Quota gratuit** | 10 identifications par mois (cahier des charges initial) ou 15 par jour (document stratégique et décision produit) | 15 par jour, avec cache, plafond de dépense quotidien et possibilité de réduire. Risque de coût détaillé en section 21 |
| **Prix du premium** | 4,99 EUR par mois (cahier initial) ou 2,99 (document stratégique). La décision produit citait des dollars | 2,99 EUR par mois et 24,99 EUR par an. Devise à confirmer |
| **Budget du MVP** | Moins de 1 000 USD (cahier initial), 12 008 USD (décision produit), 75 000 EUR (budget de l'année 1) | 12 008 USD pour le MVP. 75 000 EUR correspond à l'année 1 complète |
| **Délai** | Moins de 3 mois, soit 12 semaines (cahier initial) ; du 1er novembre au 31 décembre 2026 (décision) | Dates de la décision, soit environ 9 semaines, avec périmètre V1 réduit |
| **Identification par lien YouTube** | Cahier initial : extraction d'images depuis un lien avec des outils de téléchargement. Les conditions de YouTube interdisent téléchargement et accès automatisé sans autorisation | V1 : envoi de clips uniquement. Liens en V2 après avis juridique |
| **Niveaux de priorité** | V1, V2 et V3 dans le document stratégique ; la consigne retient seulement V1 et V2 | V3 fusionné dans V2 |
| **Pile technique** | Document stratégique : GKE, NestJS et Express, Neo4j, InfluxDB, Elasticsearch, BigQuery, Datadog. Cahier initial : Next.js, Vercel, Supabase, Redis optionnel | Pile légère du cahier initial adaptée à la décision produit (section 16). Technologies lourdes reportées |
| **Coût d'infrastructure de l'année 1** | Annoncé à environ 1 000 EUR par mois ; le détail donne 3 700 EUR par mois hors API | À rebudgéter. Cible de la V1 : services gérés à faible coût |
| **Délai de réponse** | Moins de 2 secondes (document stratégique) ou moins de 5 secondes (cahier initial) | Médiane de 5 secondes, 95e percentile de 8 secondes |
| **Disponibilité** | 99,5 % (document stratégique) ou 99 % (cahier initial) | 99,5 % |
| **Voola** | Cahier initial : iOS seulement. Les sources montrent aussi une version Android sur Google Play | Corrigé : iOS et Android |
| **ClipFix** | Cahier initial : origine États-Unis, nombreuses évaluations négatives. La fiche Gust indique l'Arménie ; la note est de 4,1 sur 5 sur 12 évaluations | Corrigé selon les sources |
| **SceneID** | Version précédente : 7 ans d'expérience, AWS Lambda et Rekognition, partenariat AWS, financement de 500 000 à 2 millions de dollars. Le site indique plus de 5 ans ; le reste n'est pas sourcé | Éléments non sourcés retirés ou classés en hypothèses (section 14.4) |
| **Letterboxd** | Document stratégique : 12 millions d'utilisateurs, pas de séries. Sources : plus de 30 millions de membres, séries annoncées | Corrigé |
| **Shazam** | Document stratégique : aucune capacité pour les films, plus de 100 millions d'utilisateurs actifs mensuels. Sources : identifie aussi des programmes de télévision ; chiffre non vérifié | Corrigé, chiffre non repris |
| **JustWatch** | Document stratégique : 60 millions d'utilisateurs. Sources : plus de 40 millions mensuels en 2023 | Chiffre vérifié repris |
| **WhatMovieIsThis** | Version précédente : 5 000 à 20 000 utilisateurs. Aucune source ; seul fait relevé : 2 abonnés Product Hunt | Chiffre non repris |
| **TMDB** | Documents sources : gratuit, données ouvertes. FAQ officielle : gratuit en non commercial seulement | Licence commerciale à obtenir avant le lancement |
| **Paiement Stripe** | Choix par défaut dans tous les documents. Des sources secondaires indiquent qu'il n'est pas disponible directement au Togo | À vérifier avant de s'engager. Prestataire ou entité alternative à prévoir |
| **Objectifs à 90 jours** | 500 utilisateurs actifs, 2 % de conversion et 200 EUR de revenu mensuel sont incompatibles : 500 x 2 % x 2,99 EUR donne environ 30 EUR | Recalibrés : 1 000 inscrits, 2,5 % de conversion, environ 75 EUR par mois |
| **Projections financières** | Revenus B2B en 2027 alors que les premiers contrats sont prévus en 2028 ; frais de fonctionnement hors salaires ; 22 706 utilisateurs contre 85 000 ; cumul de 886 931 au lieu de 885 931 | Présentées comme hypothèses avec contrôle et test de sensibilité (section 21) |
| **Avantage de VisionMatch Express** | Avantage de 2 à 3 ans annoncé alors que le même texte indique que la technologie est reproductible | Avantage non retenu ; il vient du pipeline, du score, du cache et des données |
| **Autorité togolaise de protection** | Une source la décrit comme non établie ; la presse indique un lancement officiel le 28 mars 2025 | Source la plus récente retenue, à confirmer auprès de l'IPDCP |

| **En résumé** Vingt-trois écarts ont été relevés. Les plus lourds de conséquences sont le paiement depuis le Togo, la licence TMDB, les conditions de YouTube, le coût du quota gratuit et la dépendance des projections à des revenus B2B non démontrés. Les chiffres de concurrents non sourcés ont été retirés plutôt que conservés par prudence apparente. |
| --- |

# 26. Sources et vérification

Sources consultées le 1er octobre 2026. Fiabilité : primaire (site de l'entreprise ou texte officiel), presse ou encyclopédie, secondaire (blog, agrégateur, page commerciale). Les liens doivent être ouverts une fois avant toute diffusion externe, faute de test automatisé.

| **N°** | **Source** | **Utilisée pour** | **Type** |
| --- | --- | --- | --- |
| **S1** | app.dealroom.co/companies/voola | Profil de Voola | Secondaire |
| **S2** | telefonino.net, article sur Voola pour Android | Fonctions et présence Android | Presse |
| **S3** | phonandroid.com/?p=2697878 | Téléchargements, gratuité, publicités | Presse |
| **S4** | producthunt.com/p/voola-2 | Présence iOS | Secondaire |
| **S5** | sceneid.run.place | SceneID : offre, fondateur, recherche d'investisseurs | Primaire (lu directement) |
| **S6** | gust.com/companies/clipfix | Profil de ClipFix | Secondaire (déclaratif) |
| **S7** | apps.apple.com/app/id6447082178 | ClipFix : description, note, avis | Primaire (magasin d'applications) |
| **S8** | producthunt.com/products/whatmovieisthis | WhatMovieIsThis | Secondaire |
| **S9** | ca.trustpilot.com/review/whatmovie.net | WhatMovie | Secondaire (écrit par l'entreprise) |
| **S10** | hunted.space/product/vidscio | VidScio | Secondaire |
| **S11** | similarlabs.com/p/whatisthismovie | What Is This Movie | Secondaire |
| **S12** | github.com/Benedict258/Cight | Projet open source Cight | Primaire |
| **S13** | en.wikipedia.org/wiki/Letterboxd | Letterboxd : membres, histoire | Encyclopédie |
| **S14** | au.variety.com/2026/digital/global/letterboxd-sales-talks-netflix-sony-paramount-38453/ | Letterboxd : propriétaires, rumeurs de vente | Presse |
| **S15** | tiny.com/companies/letterboxd | Letterboxd : actionnaire | Primaire |
| **S16** | en.wikipedia.org/wiki/JustWatch | JustWatch : profil, chiffres 2023 | Encyclopédie |
| **S17** | javascript.jobs/company/justwatch | JustWatch Media | Secondaire (offre d'emploi) |
| **S18** | broadcastprome.com/news/streaming-guide-justwatch-launches-in-egypt | API pour partenaires | Presse |
| **S19** | seedtable.com/startups/Shazam-3VA33A | Shazam : rachat, financement | Secondaire |
| **S20** | businessinsider.nl, article sur Shazam | Shazam : programmes de télévision | Presse |
| **S21** | developer.themoviedb.org/docs/faq | Conditions commerciales de TMDB | Primaire |
| **S22** | youtube.com/terms | Conditions d'utilisation de YouTube | Primaire |
| **S23** | api.watchmode.com | Watchmode : fonctions et niveau gratuit | Primaire |
| **S24** | droitmediasfinance.com, article sur la loi 2019-014 | Loi togolaise sur les données personnelles | Secondaire (commentaire juridique) |
| **S25** | cio-mag.com, article sur le lancement de l'IPDCP | Lancement de l'autorité | Presse |
| **S26** | consentstack.io/regulations/tg-law2019014 | Source divergente sur l'IPDCP | Secondaire (commerciale) |
| **S27** | doola.com/stripe-guide/how-to-open-a-stripe-account-in-togo | Disponibilité de Stripe au Togo | Secondaire (commerciale) |
| **S28** | zenind.com, guide Stripe pour fondateurs togolais | Disponibilité de Stripe au Togo | Secondaire (commerciale) |
| **S29** | mundobytes.com, guide Voola Movineder ClipFix | Movineder | Secondaire |
| **S30** | tribune.com.pk, article sur Letterboxd du 10 juillet 2026 | Réactions des utilisateurs à la vente | Presse |

| **En résumé** Les affirmations les plus solides de ce document s'appuient sur des textes ou pages primaires (conditions de TMDB et de YouTube, site de SceneID, magasin d'applications). Les sources secondaires et commerciales sont signalées comme telles. Les points relevant du droit (RGPD, UEMOA, procédure de l'IPDCP) et l'éligibilité au paiement doivent être confirmés par un juriste ou par les sites officiels avant toute décision. |
| --- |

	*Confidentiel - Usage interne - Version 4.0 - Octobre 2026*	*Page **1*