# Build Plan — V1

Une **unité** = un incrément vérifiable de bout en bout, une branche, une PR. On ne commence une unité que si ses dépendances sont terminées et si `/architect` a produit un plan validé, enregistré dans `context/plans/<ID>.md`. On ne la clôt qu'après `/review`, `/audit` et la mise à jour de `progress-tracker.md`.

Calendrier du CDC (section 22) : développement du 1er novembre au 31 décembre 2026. **Gel du périmètre recommandé au 20 décembre**, lancement doux auprès d'un groupe restreint.

Légende : `CDC x.y` = section du cahier des charges, `RGn` = règle de gestion.

---

## Phase 0 — Décisions bloquantes (avant le 1er novembre)

Pas de code. Chaque décision est consignée dans `progress-tracker.md`.

| ID | Décision | Bloque |
| --- | --- | --- |
| D1 | Entité juridique qui encaisse + prestataire de paiement (Stripe / Paddle / Lemon Squeezy) | U22 |
| D2 | Demande de licence commerciale TMDB envoyée ; plan B noté | U08, U15 |
| D3 | Source « où regarder » : TMDB watch/providers (attribution JustWatch) ou Watchmode | U16 |
| D4 | Compte OpenAI, modèle de vision retenu, accord de traitement des données (transfert hors UE) | U07 |
| D5 | Liste des 100 clips de test (titre attendu, type, difficulté) et lieu de stockage hors dépôt | U13 |
| D6 | Versions Next.js 16 / Node 24 validées (écart avec le CDC) | U01 |
| D7 | Valeurs RG2 (visiteur), RG4 (plafond Premium), plafond IA quotidien initial | U11, U14 |
| D8 | Nom commercial provisoire et domaine (pour emails, OAuth Google, mentions légales) | U04, U23 |
| D9 | Plans payants Vercel Pro et Supabase (production) intégrés au budget | U01 |
| D10 | Clé YouTube Data API (Google Cloud, gratuite dans la limite du quota) pour l'identification par lien — **fermée le 20 octobre 2026** | U36 |
| D11 | Application Meta (Facebook for Developers) avec la fonction « oEmbed Read », validée par Meta, et son jeton : seul accès public aux publications Instagram | U36 (Instagram) |

---

## Sprint 1 — Fondations (1er au 14 novembre)

### U01 — Socle du dépôt et déploiement
- **Objectif** : application Next.js vide déployée en préproduction et production.
- **Périmètre** : `create-next-app` (TS strict, App Router, Tailwind 4, ESLint), structure de dossiers de `architecture.md`, scripts npm de `CLAUDE.md`, `src/server/env.ts` (validation zod), GitHub Actions (lint, typecheck, test, build), projets Vercel, suivi des erreurs branché (Sentry, remplacé par PostHog : AD-28).
- **Fin** : un push sur `main` déploie ; la CI échoue si le typecheck échoue ; une erreur volontaire remonte dans PostHog (AD-28).
- **Dépend de** : D6, D9.

### U02 — Tokens de design et coquille de mise en page
- **Objectif** : tokens de `ui-context.md` en place, polices, navigation, pied de page avec mention des sources.
- **Périmètre** : init shadcn/ui puis `globals.css` selon la procédure de `ui-context.md`, `next/font` (Archivo, Public Sans), composants shadcn (button, input, label, dialog, sheet, sonner, skeleton, badge), layout racine, pages `not-found` et `error`, `/imprint` sur chaque composant.
- **Fin** : page d'accueil statique conforme au wireframe ; aucune couleur en dur (`grep`) ; Lighthouse accessibilité ≥ 90.
- **Dépend de** : U01.

### U03 — Schéma de base et migrations
- **Objectif** : toutes les tables de `architecture.md` créées par migration.
- **Périmètre** : schéma Drizzle de toutes les tables de `architecture.md`, première migration, RLS activée sans politique, buckets privés (`reports`, `avatars`, `exports`), script de seed local (1 admin, 1 utilisateur), `app_settings` initial.
- **Fin** : `npm run db:migrate` sur une base vide produit le schéma ; la clé publique Supabase ne lit aucune table (test).
- **Dépend de** : U01.

### U04 — Authentification email et Google
- **Objectif** : inscription, confirmation, connexion, déconnexion, mot de passe oublié.
- **Périmètre** : Supabase Auth + `@supabase/ssr`, `proxy.ts`, pages `(auth)` avec Server Actions, callback OAuth Google, création du `profile` à l'inscription, consentement CGU/confidentialité dans `consents`, `requireUser` / `requireAdmin` (rôle et statut relus en base), limitation de débit, réglages Supabase (RG9, RG10, 8 caractères, SMTP Resend, gabarits en français). CDC 12.4, 13.2.
- **Fin** : parcours Playwright inscription → confirmation → connexion → déconnexion ; reset utilisable une seule fois ; la 21e tentative de connexion en une heure est refusée.
- **Dépend de** : U03, D8.

### U05 — Profil
- **Objectif** : voir et modifier nom et photo.
- **Périmètre** : page profil, envoi d'avatar vers le bucket `avatars` (taille et type contrôlés). CDC 12.4.
- **Fin** : modification persistée, autre utilisateur ne peut pas modifier ce profil (test).
- **Dépend de** : U04.

### U06 — Extraction d'images dans le navigateur
- **Objectif** : à partir d'un fichier vidéo local, extraire 3 à 5 images JPEG et ne garder que les exploitables (2 minimum). Les hash calculés ici servent seulement à écarter les doublons ; ceux du cache sont calculés par le serveur (U10).
- **Périmètre** : `src/shared/frames/` (instants d'échantillonnage, seuils), `src/client/frames/` (validation format/durée/taille, canvas 768 px, rejet noir/flou/doublon), composants `ClipDropzone` et `FilmStrip` (sans appel serveur). CDC 12.1.
- **Fin** : tests unitaires des filtres ; test manuel sur Chrome Android et Safari iOS avec MP4, MOV, WebM ; < 2 images exploitables → message clair.
- **Dépend de** : U02.

---

## Sprint 2 — Pipeline d'identification (15 au 28 novembre)

### U07 — Couche IA et adaptateur OpenAI
- **Objectif** : `VisionProvider.identify()` renvoie un résultat validé par zod.
- **Périmètre** : interface, `OpenAIVisionProvider`, consigne `identify.v1`, JSON strict, timeout, 3 tentatives avec délai croissant (RG16), calcul du coût. CDC 15.1, 16.
- **Fin** : tests avec fournisseur simulé ; un appel réel en local renvoie un objet conforme.
- **Dépend de** : D4.

### U08 — Client TMDB et rapprochement
- **Objectif** : retrouver l'identifiant TMDB d'un titre proposé.
- **Périmètre** : `TmdbCatalog` (recherche film/série en `fr-FR`, détails, configuration des images), cache Redis des réponses, fonction de rapprochement (titre, année, type). CDC 12.1.
- **Fin** : tests sur 20 titres connus (titres français et originaux) ; aucune réponse TMDB ne passe sans validation zod.
- **Dépend de** : U03, D2.

### U09 — Score de confiance
- **Objectif** : combiner confiance du modèle, correspondance TMDB, cohérence année/type.
- **Périmètre** : `scoring.ts`, constantes nommées, décision afficher / afficher avec alternatives / demander un autre clip. CDC 15.2.
- **Fin** : tests unitaires couvrant les trois décisions.
- **Dépend de** : U07, U08.

### U10 — Cache par empreinte
- **Objectif** : un extrait déjà analysé ne rappelle pas l'IA.
- **Périmètre** : dHash calculés côté serveur (`sharp`), empreinte exacte (Redis) puis correspondance proche (`result_cache_frames`, Hamming), seuils en constantes, écriture seulement au-dessus de `CACHE_MIN_CONFIDENCE`, désactivation d'une entrée signalée. CDC 15.3, RG6.
- **Fin** : tests : même jeu d'images deux fois → un seul appel IA, second résultat `source: cache` ; images légèrement recompressées → toujours un hit ; deux clips différents du même film → pas de faux rapprochement.
- **Dépend de** : U03.

### U11 — Route `/api/identify` et quotas
- **Objectif** : identification de bout en bout avec décompte correct.
- **Périmètre** : route (multipart, contrôle `sharp` du type réel), `server/quota` (vérifier / réserver / confirmer / libérer, jour Europe/Paris), visiteur par cookie signé, ordre exact du flux de `architecture.md`, persistance `identifications`, route `GET /api/quota` (restant + `resetAt`) pour le compteur. RG1–RG4, RG6, RG7, RG16.
- **Fin** : tests : 16e identification refusée avec `resetAt` ; échec IA non décompté ; résultat < 50 % non décompté ; cache non décompté ; deux requêtes simultanées alors qu'il ne reste qu'une identification → une seule aboutit, l'autre reçoit `QUOTA_EXCEEDED` ; changement de jour à minuit Paris, y compris lors du passage à l'heure d'hiver.
- **Dépend de** : U06, U09, U10, D7.

### U12 — Écran de résultat
- **Objectif** : afficher le résultat dans le flux de l'accueil.
- **Périmètre** : `IdentificationResult`, `ConfidenceBadge`, `AlternativeList`, `QuotaCounter` branché, états chargement/erreur/aucun résultat, région `aria-live`. CDC 13.1.
- **Fin** : parcours Playwright (IA simulée) clip → résultat ; `/imprint` exécuté.
- **Dépend de** : U11.

### U13 — Harnais du jeu de test
- **Objectif** : mesurer la précision avant tout changement de consigne ou de modèle.
- **Périmètre** : `eval/manifest.json` (chemins externes + titre attendu), script `npm run eval` : extraction des images avec `ffmpeg-static` et les paramètres de `src/shared/frames/`, appel du pipeline **sans cache ni quota** (option `bypassCache`, jamais exposée par l'API), sur l'environnement de développement uniquement ; rapport : précision, latence médiane/p95, coût moyen, liste des échecs. CDC 9.2, 17.
- **Fin** : rapport généré sur les 100 clips ; résultat consigné dans `progress-tracker.md`.
- **Dépend de** : U11, D5.

### U14 — Plafond de dépense IA
- **Objectif** : couper l'IA au-delà du plafond quotidien.
- **Périmètre** : compteur Redis `ai:spend:{jour}` avec réservation du coût maximal estimé puis ajustement, miroir `ai_spend_daily`, réponse `AI_PAUSED`, message d'attente côté UI, alerte à l'admin via PostHog (l'alerte email s'ajoute en U23). RG5.
- **Fin** : test : plafond à 0 → aucune identification IA, le cache fonctionne encore ; des requêtes simultanées ne dépassent pas le plafond de plus d'un appel.
- **Dépend de** : U11.

---

## Sprint 3 — Fiche, suivi et paiement (29 novembre au 12 décembre)

### U15 — Fiche titre (SSR)
- **Objectif** : fiche complète, référencée.
- **Périmètre** : route `/titre/{film|serie}/{id}-{slug}`, `generateMetadata` + image Open Graph, `TitleHeader`, `CastRow`, `TrailerPlayer` (youtube-nocookie, chargement au clic), `SimilarTitles` avec motif, mention TMDB, `robots.txt` et `sitemap.xml` des titres déjà identifiés. CDC 12.2, 12.6, 15.4.
- **Fin** : p95 < 800 ms avec cache ; fiche valide pour un film et une série ; slug incorrect → redirection vers le bon.
- **Dépend de** : U08.

### U16 — Où regarder
- **Objectif** : services disponibles dans le pays de l'utilisateur.
- **Périmètre** : `WatchProvider`, pays déduit (en-tête géographique Vercel, repli FR), types d'accès, liens, attribution. CDC 12.3.
- **Fin** : affichage correct pour FR, BE, CH ; aucun service → message explicite.
- **Dépend de** : U15, D3.

### U17 — Historique
- **Objectif** : 50 dernières identifications de l'utilisateur.
- **Périmètre** : page historique, rattachement de l'identification à l'utilisateur connecté. RG11.
- **Fin** : un utilisateur ne voit que les siennes (test).
- **Dépend de** : U11.

### U18 — Liste de suivi
- **Objectif** : ajouter / retirer un titre.
- **Périmètre** : `/api/watchlist`, limite 100 en gratuit (`WATCHLIST_FULL`) via `getEntitlement()` (qui renvoie « gratuit » tant que U22 n'existe pas), bouton optimiste sur résultat et fiche, page liste, demande de connexion pour un visiteur. CDC 12.5.
- **Fin** : tests de la limite à 100 ; test unitaire avec un entitlement Premium simulé (le test réel est refait en U22).
- **Dépend de** : U15.

### U19 — Partage
- **Objectif** : lien public vers la fiche identifiée.
- **Périmètre** : bouton de partage (Web Share API, repli copie du lien). CDC 12.5.
- **Fin** : le lien ouvert sans compte affiche la fiche avec aperçu Open Graph.
- **Dépend de** : U15.

### U20 — Signalement d'erreur
- **Objectif** : corriger un résultat faux, avec consentement.
- **Périmètre** : `ReportDialog` (recherche du bon titre via `GET /api/catalog/search`, case de consentement non cochée), `/api/reports`, envoi des images au bucket privé seulement si consenti (`reports.images_consent`), désactivation de l'entrée de cache concernée. Ouvert aux visiteurs comme aux utilisateurs. RG7, RG8.
- **Fin** : sans consentement, aucune image stockée (test) ; avec consentement, images visibles côté admin seulement.
- **Dépend de** : U12, U03.

### U21 — Tarifs et paywall
- **Objectif** : comparer gratuit et Premium, inviter au Premium au bon moment.
- **Périmètre** : page `/tarifs`, composant `Paywall` sur `QUOTA_EXCEEDED`, fiches toujours consultables. CDC 12.8.
- **Fin** : quota épuisé → paywall, fiche toujours accessible.
- **Dépend de** : U12.

### U22 — Abonnement Premium
- **Objectif** : payer, activer, gérer, résilier.
- **Périmètre** : `BillingProvider`, page de paiement hébergée (mensuel 2,99 EUR / annuel 24,99 EUR), webhook signé et idempotent, `getEntitlement()`, page abonnement (plan, renouvellement, historique, résiliation via portail du prestataire). RG12–RG14, CDC 13.3.
- **Fin** : en mode test, paiement → Premium < 30 s ; webhook rejoué → aucun doublon ; webhook à signature invalide → rejeté ; résiliation → accès jusqu'à `current_period_end` ; la liste de suivi dépasse 100 titres en Premium.
- **Dépend de** : D1, U04.

### U23 — Emails transactionnels
- **Objectif** : tous les emails V1 en français.
- **Périmètre** : `Mailer` Resend, gabarits React Email (reçu si non envoyé par le prestataire, rappel J-3, confirmation de résiliation, lien d'export, confirmation de suppression, alerte admin du plafond IA), domaine authentifié SPF/DKIM/DMARC. Les emails de confirmation et de reset restent ceux de Supabase (configurés en U04). CDC 12.11.
- **Fin** : chaque gabarit reçu dans une vraie boîte ; 95 % envoyés < 60 s.
- **Dépend de** : U22, D8.

### U24 — Export et suppression du compte
- **Objectif** : droits RGPD en libre-service.
- **Périmètre** : export JSON (profil, historique, liste, consentements, abonnement) déposé dans le bucket `exports`, lien signé valable 24 h envoyé par email ; suppression avec confirmation par mot de passe ou email, désactivation immédiate, annulation de l'abonnement, effacement définitif sous 30 jours par cron. RG14, RG15, CDC 13.4.
- **Fin** : parcours Playwright export puis suppression ; les données disparaissent des tables (test).
- **Dépend de** : U22.

---

## Sprint 3 bis — Modes d'identification élargis (ajout du fondateur, 20 octobre 2026)

Ajout de périmètre décidé par le fondateur (AD-37 à AD-40) : le cahier des charges ne prévoyait en V1 que l'envoi d'un clip MP4, MOV ou WebM ; l'identification par lien y était prévue en V2. Règle inchangée : **le serveur ne reçoit jamais de vidéo** (invariant 1).

### U33 — Formats vidéo élargis et conversion de secours
- **Objectif** : qu'une vidéo de téléphone courante soit analysée, quel que soit son format.
- **Périmètre** : formats MP4, MOV, WebM, M4V, 3GP, MKV et AVI (type MIME ou extension) ; vidéos jusqu'à 500 Mo et de toute durée, dont on n'analyse qu'un extrait de 60 secondes (choisi au milieu, ou à partir d'un instant réglable) ; vidéo que le navigateur ne sait pas lire (HEVC, AVI, codecs rares) : conversion dans le navigateur par ffmpeg.wasm, chargé seulement dans ce cas, avec progression affichée ; messages clairs à chaque refus ; diagnostic du problème actuel (« la fonctionnalité ne fonctionne pas comme prévu ») sur les vidéos d'essai du fondateur. AD-40.
- **Fin** : tests unitaires des contrôles ; jeu de vidéos d'essai (au moins un fichier par format, une vidéo HEVC d'iPhone, une vidéo de plus de 60 s et de plus de 50 Mo) analysé avec succès sur Chrome Android, Safari iOS et Chrome Windows ; la vidéo n'est jamais envoyée (test réseau).
- **Dépend de** : U06, U12.

### U34 — Identification par image
- **Objectif** : identifier un titre à partir de 1 à 5 captures d'écran ou photos d'un écran.
- **Périmètre** : choix « Clip ou Images » dans la zone d'envoi ; JPEG, PNG, WebP et HEIC (converti dans le navigateur), réduits à 768 px et compressés dans le navigateur ; même pipeline que le clip (contrôle du type réel, cache par empreinte, quota, règle de décompte RG3, plafond IA, signalement) ; invariant 1 étendu : 1 à 5 images pour ce mode. AD-38.
- **Fin** : tests du contrôle (1 à 5 images, 1,5 Mo au total) ; Playwright : capture → résultat ; une même capture renvoyée sert le cache sans décompte.
- **Dépend de** : U11, U12.

### U35 — Identification par description
- **Objectif** : retrouver un titre décrit avec ses mots (« un film où un homme revit la même journée »).
- **Périmètre** : champ de 10 à 500 caractères ; appel IA texte seul via `server/ai` (nouvelle méthode du fournisseur, consigne versionnée `describe.v1`, sortie JSON validée), jusqu'à 3 propositions rapprochées de TMDB avec leur confiance ; même quota et même règle de décompte que les autres modes ; garde de dépense ; texte jamais journalisé (invariant 9) ; pas de cache par empreinte (cache facultatif par texte normalisé). AD-39.
- **Fin** : tests avec fournisseur simulé ; jeu de 20 descriptions de titres connus évalué (`npm run eval`, volet description) ; Playwright : description → résultat.
- **Dépend de** : U07, U11, U12.

### U36 — Identification par lien (métadonnées publiques)
- **Objectif** : identifier le film d'une publication YouTube, TikTok ou Instagram à partir de son lien.
- **Périmètre** : champ « Coller un lien » ; le serveur ne télécharge **jamais** la vidéo : il lit les métadonnées publiques (YouTube Data API officielle : titre, description, chaîne, vignette ; TikTok et Instagram : aperçu public oEmbed, légende et vignette), puis l'IA en déduit le titre (texte + vignette) ; liste blanche de domaines et protection SSRF (aucune requête vers une autre adresse) ; même quota et même règle de décompte ; message clair quand la publication ne donne aucun indice (proposer l'envoi d'un clip). Clé YouTube Data API (décision D10). Validation juridique à confirmer avant l'ouverture publique (Q23). AD-37.
- **Fin** : tests du filtrage des liens (domaines, SSRF, redirections) ; tests avec réponses simulées des trois plateformes ; Playwright : lien → résultat.
- **Dépend de** : U35, D10.

---

## Sprint 4 — Pilotage, conformité, lancement (13 au 31 décembre)

### U25 — Back-office : tableau de bord
- **Périmètre** : `/admin` (rôle admin), indicateurs : utilisateurs, identifications/jour, taux de réussite, coût IA, revenus. CDC 12.9.
- **Fin** : accès refusé à un non-admin (test) ; chiffres cohérents avec la base de seed.
- **Dépend de** : U14, U22.

### U26 — Back-office : actions et journal d'audit
- **Périmètre** : utilisateurs (recherche, suspension, suppression), signalements (revue, « ajouter au jeu de test »), abonnements (correction manuelle), réglage des plafonds, journal d'audit consultable. Invariant 5.
- **Fin** : chaque action produit une ligne d'audit dans la même transaction (test).
- **Dépend de** : U25, U20.

### U27 — Pages légales et consentements
- **Périmètre** : CGU, confidentialité, mentions légales, page « À propos » avec mentions TMDB et source streaming, bandeau de consentement analytique si nécessaire. CDC 18.2.
- **Fin** : pages relues par le fondateur ; liens présents dans le pied de page et l'inscription.
- **Dépend de** : U02.

### U28 — Durcissement sécurité
- **Périmètre** : en-têtes (CSP, HSTS…), revue des limitations de débit, revue des journaux (aucune donnée sensible), analyse des dépendances en CI, test de restauration de sauvegarde. CDC 18.1.
- **Fin** : checklist CDC 18.1 cochée, notée dans `progress-tracker.md`.
- **Dépend de** : U26.

### U29 — Observabilité et analytique
- **Périmètre** : événements (identification, résultat, ajout à la liste, passage Premium), sonde de disponibilité, alertes PostHog (erreurs), envoi des source maps à PostHog, suivi du coût IA. CDC 16, 17.
- **Fin** : un événement de chaque type visible ; une panne simulée déclenche une alerte.
- **Dépend de** : U12, U22.

### U30 — Tâches planifiées
- **Périmètre** : crons de `architecture.md` (exports 24 h, historique 2 ans, comptes supprimés 30 jours, rappel J-3, images de signalement selon Q16, consolidation de la dépense IA).
- **Fin** : chaque cron testé avec des données datées artificiellement.
- **Dépend de** : U20, U22, U24.

### U31 — Passe performance et accessibilité
- **Périmètre** : budgets CDC 17 (JS < 300 Ko, LCP < 2,5 s en 4G, utilisable < 6 s en 3G), audit WCAG AA, test clavier et lecteur d'écran, `/imprint audit`.
- **Fin** : rapports Lighthouse/WebPageTest archivés, écarts corrigés ou consignés.
- **Dépend de** : toutes les unités UI.

### U32 — Bêta fermée et lancement
- **Périmètre** : 20 à 50 testeurs, collecte des signalements, `npm run eval` final ≥ 85 %, test de charge k6 (500 simultanés), checklist de mise en production, gel au 20 décembre.
- **Fin** : lancement doux le 31 décembre 2026, surveillance renforcée la première semaine.
- **Dépend de** : U01 à U31, U33 à U36.

---

## Chemin critique

D1 → U22 → U23 / U24, et D4 → U07 → U09 → U11 → U13. Un retard sur le choix du prestataire de paiement ou sur l'accès OpenAI décale directement le lancement : ce sont les deux premières décisions à fermer.
