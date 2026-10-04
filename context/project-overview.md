# Plateforme cinéphile (nom commercial à définir)

> Source fonctionnelle complète : `docs/cahier-des-charges-v4.md` (version 4.0, 1er octobre 2026).
> Ce fichier en est la synthèse opérationnelle pour le développement de la V1.

## Overview

Un spectateur voit un extrait de film ou de série sur TikTok, YouTube ou Instagram sans en connaître le titre. La plateforme lui permet d'envoyer ce clip depuis son appareil : le navigateur en extrait 3 à 5 images, un modèle de vision identifie le titre avec un niveau de confiance, et l'utilisateur obtient une fiche complète (affiche, synopsis, distribution, bande-annonce), la liste des services de streaming où le regarder dans son pays, des titres similaires, et peut l'enregistrer dans sa liste de suivi. Cible : cinéphiles francophones de 16 à 45 ans (France, Belgique, Suisse), interface en français uniquement. Modèle économique : 15 identifications gratuites par jour, Premium à 2,99 EUR par mois ou 24,99 EUR par an.

**Le problème en une phrase :** un cinéphile qui voit un extrait n'a aucun moyen simple, fiable et en français de savoir de quel film il s'agit, puis de le retrouver, de le suivre et de savoir où le regarder.

## Acteurs

| Acteur | Ce qu'il peut faire en V1 |
| --- | --- |
| Visiteur | Identifier dans la limite d'un quota réduit (RG2, à valider), voir un résultat et une fiche, créer un compte. Aucun historique. |
| Utilisateur gratuit | 15 identifications/jour, fiches, liste de suivi (100 titres max), historique, signalement d'erreur, partage, passage Premium. |
| Utilisateur Premium | Idem sans limite quotidienne stricte (plafond anti-abus RG4), liste illimitée, gestion de l'abonnement, factures. |
| Administrateur | Tableau de bord, utilisateurs, signalements, abonnements, plafond de dépense IA, journal d'audit. |

Systèmes externes : fournisseur d'IA (OpenAI vision), TMDB (métadonnées), données « où regarder », prestataire de paiement, service d'emails.

## Goals (90 jours après le lancement)

1. Taux d'identification correcte ≥ 85 % (90 % visé) sur le jeu de test interne de 100 clips.
2. Temps d'identification : médiane 5 s, 95e percentile 8 s, du clic au résultat.
3. 1 000 utilisateurs inscrits, rétention à 30 jours ≥ 30 %.
4. Conversion gratuit → Premium 2,5 % (≈ 25 abonnés, ≈ 75 EUR de revenu mensuel récurrent).
5. Coût IA moyen ≤ 0,02 EUR par identification.
6. Taux d'erreur serveur < 2 % des identifications, < 1 % des autres requêtes.

## Core User Flow

1. L'utilisateur ouvre l'accueil : zone d'envoi, compteur d'identifications restantes, exemple.
2. Il sélectionne un clip (MP4, MOV ou WebM, ≤ 60 s, ≤ 50 Mo).
3. Le navigateur valide le fichier, extrait les images, écarte les images noires, floues ou quasi identiques. Moins de 2 images exploitables → demande un autre clip.
4. Le serveur vérifie le quota, interroge le cache (empreinte des images), puis appelle le modèle de vision et rapproche la réponse avec TMDB.
5. Le résultat s'affiche : titre principal, confiance en %, 3 alternatives, bouton « Ce n'est pas le bon titre ». Décompte si confiance ≥ 50 %.
6. Il ouvre la fiche : informations, distribution, bande-annonce, où regarder, titres similaires avec motif.
7. Il ajoute le titre à sa liste de suivi (connexion demandée s'il est visiteur).
8. Si le titre est faux, il signale l'erreur, choisit le bon titre et consent (ou non) à la conservation des images.
9. Quota atteint → paywall vers la page des tarifs → paiement hébergé chez le prestataire → Premium actif dès confirmation.

## Features (V1 uniquement)

### Identification vidéo

- Envoi d'un clip, extraction de 3 à 5 images côté navigateur, contrôle de qualité des images.
- Analyse par modèle de vision avec consigne versionnée et réponse JSON stricte (titre, année, type, épisode si possible, confiance 0–100).
- Rapprochement TMDB ; absence de correspondance → baisse de la confiance. Le résultat porte l'identifiant TMDB.
- Score de confiance combiné et vérification croisée (section 15.2 du CDC).
- Affichage : titre + 3 alternatives, confiance, affiche, année, synopsis court.
- Signalement d'erreur avec consentement, qui alimente le jeu de test.
- Cache des résultats par empreinte d'images.

### Fiche titre et « où regarder »

- Fiche : titre, année, durée, genres, synopsis, note, affiche, type (film, série, animé).
- Distribution et équipe principales avec photo ; bande-annonce intégrée ; 5 à 10 titres similaires avec motif (« même réalisateur », « même genre »).
- Disponibilité par pays (abonnement, location, achat) avec lien vers le service si connu.
- Mention obligatoire de TMDB (et de la source des données de streaming).

### Comptes

- Inscription email + mot de passe (8 caractères min.) avec confirmation par lien ; connexion Google.
- Mot de passe oublié : lien valable 24 h, usage unique.
- Profil : nom, photo, date d'inscription.
- Export des données (JSON) et suppression du compte en libre-service.

### Historique, liste, partage

- Historique : 50 dernières identifications (date, titre, confiance), conservées 2 ans.
- Liste de suivi : ajout/retrait, 100 titres max en gratuit, illimitée en Premium.
- Partage d'un résultat par lien public vers la fiche.

### Monétisation

- Quota gratuit visible en permanence, paywall qui ne bloque jamais la consultation des fiches.
- Premium 2,99 EUR/mois ou 24,99 EUR/an, paiement hébergé chez le prestataire.
- Gestion de l'abonnement (plan, renouvellement, historique, résiliation), reçus par email, rappel 3 jours avant renouvellement.

### Administration

- Tableau de bord : utilisateurs, identifications/jour, taux de réussite, coût IA, revenus.
- Gestion des utilisateurs (recherche, suspension, suppression), revue des signalements, correction manuelle d'un abonnement.
- Réglage du plafond de dépense IA quotidien et suspension automatique.
- Journal d'audit de toutes les actions d'administration.

### Emails transactionnels

- Confirmation d'inscription, réinitialisation, reçu de paiement, rappel de renouvellement, confirmation de résiliation, confirmation de suppression.

## Règles de gestion

| N° | Règle |
| --- | --- |
| RG1 | 15 identifications/jour pour un compte gratuit, remise à zéro à minuit heure de Paris. |
| RG2 | Visiteur : 3 identifications/jour proposées. **À valider.** |
| RG3 | Décompte uniquement si un résultat de confiance ≥ 50 % est affiché. |
| RG4 | Premium : pas de limite stricte, plafond anti-abus. **Valeur à fixer après mesure.** |
| RG5 | Plafond quotidien de dépense IA : suspend les nouvelles identifications, message d'attente, alerte admin. |
| RG6 | Cache : même empreinte d'images → résultat enregistré, aucun appel IA, aucun décompte. |
| RG7 | Seules les images extraites sont transmises, supprimées au plus tard 24 h après l'analyse, sauf signalement consenti. |
| RG8 | Signalement : conserve images, proposition et titre correct, uniquement avec consentement. |
| RG9 | Session expirée après 30 jours d'inactivité ; la déconnexion supprime le jeton. |
| RG10 | Lien de réinitialisation valable 24 h, usage unique. |
| RG11 | 50 dernières identifications affichées, conservées 2 ans puis supprimées. |
| RG12 | Aucune donnée de carte stockée ; seul l'identifiant du prestataire est conservé. |
| RG13 | Renouvellement automatique, email de rappel 3 jours avant. |
| RG14 | Résiliation : Premium actif jusqu'à la fin de la période payée ; données conservées 30 jours après la fin. |
| RG15 | Export JSON et suppression du compte dans les paramètres. |
| RG16 | Erreur serveur : 3 tentatives avec délai croissant, puis message clair ; échec non décompté. |
| RG17 | Aucune donnée utilisée pour le B2B sans consentement explicite et anonymisation. |

## Scope

### In Scope (V1)

- Application web responsive (mobile d'abord), en français, facturation en euros.
- Neuf écrans : accueil/identification, résultat, fiche titre, inscription/connexion, profil/paramètres, historique/liste de suivi, tarifs/abonnement, pages légales, back-office.
- Identification par envoi de clip uniquement.
- Recommandations par contenu (genres, distribution, réalisateur via TMDB).
- Préparation B2B limitée au recueil du consentement et à un schéma de données anonymisable.

### Out of Scope (V2 ou plus tard)

- Identification par lien (YouTube, TikTok, Instagram), enregistrement d'écran, analyse audio, modèle propriétaire DeepCine.
- Connexion Apple et Facebook, double authentification, préférences (thème sombre, langue).
- Comparaison de prix, alertes de disponibilité, pages personnes, saisons/épisodes détaillés.
- Statut vu, collections, import Letterboxd/Trakt, export CSV.
- Filtrage collaboratif, humeur, assistant conversationnel.
- Toute la communauté (profils publics, avis, discussions).
- Période d'essai, mobile money, Premium+, Famille, parrainage.
- Applications iOS, Android, TV ; portail et API B2B ; autres langues.
- Jamais sans décision explicite : hébergement ou lecture de films, reconnaissance de visages, contenus pour adultes, vente de données individuelles.

## Success Criteria

1. Un visiteur peut envoyer un clip MP4 de 30 s depuis un téléphone Android en 4G et voir un résultat en moins de 8 s.
2. Le jeu de test de 100 clips donne ≥ 85 % de titres corrects, mesuré par `npm run eval`.
3. Un même clip envoyé deux fois ne déclenche qu'un seul appel IA et n'est décompté qu'une fois.
4. Un utilisateur gratuit est bloqué à la 16e identification décomptée du jour et débloqué à minuit (Paris).
5. Un utilisateur peut s'inscrire par email ou Google, payer le Premium, voir son statut changer en moins de 30 s, résilier et garder l'accès jusqu'à la fin de la période.
6. Un utilisateur peut exporter ses données en JSON et supprimer son compte sans intervention humaine.
7. Quand le plafond de dépense IA est atteint, les nouvelles identifications sont suspendues avec un message et l'admin reçoit une alerte.
8. Toute action admin apparaît dans le journal d'audit.
9. Les pages passent l'audit Lighthouse accessibilité ≥ 90 et le parcours complet se fait au clavier.
