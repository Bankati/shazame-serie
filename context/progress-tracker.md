# Progress Tracker

Mettre à jour ce fichier après chaque changement d'implémentation significatif.

## Current Phase

- Phase 0 — Décisions bloquantes (jusqu'au 31 octobre 2026), en parallèle de U01 (démarrée le 7 octobre 2026).

## Current Goal

- Fermer les décisions restantes D1 à D5 et D8 de `build-plan.md`, en priorité D1 (paiement) et D4 (accès OpenAI), qui sont sur le chemin critique.
- Démarrer U01 (`/architect`), désormais débloquée.

## Comptes de service (15 octobre 2026)

- TMDB : clé « Developer » (jeton de lecture) active, vérifiée par une recherche. Licence commerciale à demander (D2, Q2, Q3).
- OpenAI : compte, crédits et projet de développement actifs, clé vérifiée (133 modèles accessibles). Modèle de vision à choisir en U07 / U13 (Q4) ; DPA à accepter avant la bêta (D4).
- Upstash Redis : base de développement active (PING vérifié). Région à confirmer : eu-west-1.
- Les clés sont dans `.env.local` (non versionné). La clé OpenAI est passée par une conversation : à régénérer avant la bêta.

## Completed

- U02 — Tokens de design et coquille de mise en page (7-8 octobre 2026, plan `context/plans/U02.md`). shadcn/ui (Radix, preset Nova), tokens, polices, en-tête, menu mobile, pied de page (mentions TMDB et JustWatch), pages 404 / erreur, accueil statique (AD-23), `npm run check:design` en CI (règles testées), `/imprint` (12 entrées). `/review` et `/audit` exécutés ; corrigés : navigation à partir de 1 024 px, offre Premium affichée « Jusqu'à 100 identifications par jour » (RG4, AD-20), tests du contrôle de design. Lighthouse mobile : accessibilité 100, bonnes pratiques 100, SEO 100, performance 75 (SDK Sentry navigateur, à traiter avant le lancement : voir `library-docs.md`). 40 tests.
- Décisions D6 (Next 16 / Node 24), D7 (valeurs RG2, RG4, plafond IA) et D9 (plans payants en production) fermées (7 octobre 2026).
- Cahier des charges V4 rédigé (1er octobre 2026), converti en `docs/cahier-des-charges-v4.md`.
- Fichiers de contexte et skills du projet créés (4 octobre 2026), puis relus intégralement et corrigés (cohérence entre fichiers, vocabulaire shadcn/ui, sécurité du cache, dépendances du build plan).
- Dépôt GitHub `Bankati/shazame-serie` branché, branches `dev` / `staging` / `main`, CI GitHub Actions (lint, typecheck, test Vitest, build, audit production), contrôle du sens de promotion, Dependabot vers `dev` (4 octobre 2026). Partie « CI » de U01 en avance ; restent pour U01 : structure de dossiers, `env.ts`, Vercel, Sentry.

## In Progress

- U01 — Socle du dépôt et déploiement (plan validé le 7 octobre 2026 : `context/plans/U01.md`).
  - Fait (7 octobre 2026) : versions alignées (AD-21), `env.ts` + tests, `/api/health` et `/api/health/sentry-check`, Sentry serveur/edge/navigateur avec `dataCollection` coupé et `scrubEvent` testé, `global-error.tsx`, page d'accueil provisoire, job CI anti-secrets, `smoke.yml`, Dependabot (ignore TS ≥ 6.1, ESLint ≥ 10), `.env.example`, `docs/setup-deploiement.md`. lint / typecheck / test (17) / build / audit verts en local.
  - `/review` et `/audit` exécutés le 7 octobre 2026 ; corrections appliquées (filtrage Sentry des traces, garde de domaine du test de fumée, DSN https, fragment d'URL, messages d'erreur dans `src/content/fr/errors.ts`, tests de routes). Écart accepté : pas de limitation de débit sur `/api/health/sentry-check` avant U11 (Upstash) — à ajouter en U11.
  - Reste : réglages Vercel, PostHog et GitHub par le fondateur (`docs/setup-deploiement.md`), vérification du critère de fin sur staging puis production (erreur volontaire visible dans PostHog, AD-28).

- OBS — Remplacement de Sentry par PostHog (plan validé le 8 octobre 2026 : `context/plans/OBS.md`).
  - Fait (8 octobre 2026) : `@sentry/nextjs` retiré ; `posthog-js` 1.438.3 et `posthog-node` 5.55.1 ; init navigateur sans cookie (`instrumentation-client.ts`), `onRequestError` → `captureServerError`, `global-error.tsx`, filtre `scrubEvent` + `withEnvironment` testés, `/api/health/error-check` (ex-`sentry-check`), `env.ts` (clé PostHog et `CRON_SECRET` obligatoires en production seulement), documentation et contexte. Build vérifié : local et preview sans variables passent ; production sans variables refusée.
  - `/review` et `/audit` exécutés ; corrections : erreurs navigateur des pages d'erreur envoyées (sans doublon des erreurs serveur), tests de `captureServerError`, `env.ts` validé aussi en edge, échec d'envoi signalé sans détail, PostHog chargé après la page et au repos (`src/client/observability/posthog.ts`). Clé de projet vérifiée auprès de PostHog UE (14 octobre 2026). 60 tests.
  - Lighthouse mobile, build de production local (14 octobre 2026, 2 passages chacun, poste de développement) : sans PostHog 65-66 (TBT ≈ 1 070 ms) ; PostHog chargé au repos 58-62 ; chargé dès l'hydratation 53. Accessibilité, bonnes pratiques, SEO : 100. À remesurer sur le déploiement Vercel avant le lancement (U28) ; piste : bundle `module.slim` de posthog-js, dont l'option d'extensions est marquée interne.
  - Reste : confirmation par le fondateur de l'erreur `ErrorCheckError` dans PostHog → Error tracking ; variables Vercel (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `CRON_SECRET`).

- U03 — Schéma de base et migrations (plan validé le 8 octobre 2026 : `context/plans/U03.md`).
  - Fait (8 octobre 2026) : Supabase CLI locale, schéma Drizzle des 13 tables (RLS partout, FK `auth.users`), migrations `0000` (schéma), `0001` (buckets privés + `app_settings` AD-20), `0002` (aucun droit pour `anon` / `authenticated` sur `public`, défense en profondeur), seed local idempotent qui refuse toute base distante, 40 tests d'intégration (`npm run test:db`) dont contrôle négatif vérifié à la main, job CI « Base de données », workflow `db-migrate.yml` (préproduction / production avec approbation). Critère de fin démontré : base vide → `db:migrate` → schéma complet ; clé publique sans aucun accès.
  - Relecture : pour U10, dédoublonner les dHash avant insertion dans `result_cache_frames` (clé primaire `cache_id, frame_hash`).
  - `/audit` exécuté le 8 octobre 2026 ; corrections appliquées : `db-migrate.yml` limité à `staging` / `main` (+ branches autorisées des environnements GitHub dans le guide), migration `0003` (`profiles.avatar_url` → `avatar_path`, contrainte « compte ou visiteur » sur `identifications`), test de la RLS indépendant des droits (contrôle négatif vérifié), mot de passe local 8 caractères, AD-25, AD-26 (Q23). 54 tests `test:db`.
  - Pour U04 : le premier code qui lit la base respecte AD-25.
  - Projet Supabase `shazam_serie` (région eu-west-1, PostgreSQL 17) créé par le fondateur ; identifiants vérifiés en lecture seule le 8 octobre 2026 (pooler 5432 et 6543, clés publishable et secrète) ; base encore vide. Un seul projet pour préproduction et production (AD-27).
  - Reste : CI GitHub verte, secrets saisis par le fondateur dans GitHub (environnement `production`) et Vercel, premier lancement du workflow `Database migrations` sur `main`.

- U06 — Extraction d'images dans le navigateur (plan validé le 14 octobre 2026 : `context/plans/U06.md`).
  - Fait (14 octobre 2026) : `src/shared/frames/` (constantes, échantillonnage 10-90 %, luminosité, netteté, dHash, sélection), `src/client/frames/` (contrôle du clip, extraction vidéo/canvas/JPEG, `fitPackage` ≤ 1,5 Mo, WebM sans durée), `ClipDropzone`, `FilmStrip`, `IdentifyPanel` dans le hero (« N images prêtes. L'identification ouvre très bientôt. »), `/imprint`, `/review`, `/audit`. Cible TypeScript ES2020 (BigInt). 109 tests. Essai Chrome (largeur mobile) : MP4, MOV, WebM, WebM sans durée, noir, flou, image fixe, trop long, trop court, mauvais format ; extraction en 0,6 à 1,2 s.
  - Reste (fondateur) : essai Chrome Android et Safari iOS (MP4, MOV, WebM) sur la préproduction ; essai de 3-4 extraits réels (action, dialogue en plan fixe, nuit) pour vérifier les seuils (noir 20, flou 20, doublon 5 bits), calibrés ensuite en U13.

- U10 — Cache par empreinte (plan validé le 15 octobre 2026 : `context/plans/U10.md`).
  - Fait (15 octobre 2026) : `src/server/db/client.ts` (`getDb`, `withQueryTimeout` 5 s par `SET LOCAL`, le pooler ignorant les réglages de connexion), `DATABASE_URL` (obligatoire en production), `src/server/identification/frame-hashes.ts` (dHash serveur `sharp`, empreinte d'extrait), `result-cache.ts` (exact + proche en SQL, écriture ≥ 80 % ou validée, désactivation, `withResultCache` avec écritures « au mieux »), `src/server/log.ts` (logger structuré, utilisé aussi par PostHog), `vercel.json` (région `dub1`). `/review` et `/audit` exécutés et corrigés. 123 tests unitaires, 65 tests de base (critère de fin démontré).
  - À faire en U13 : exécuter l'eval avec le cache contourné, puis calibrer `CACHE_MAX_HAMMING` (6), `CACHE_MIN_MATCHING_FRAMES` (2), `CACHE_MIN_CONFIDENCE` (80).
  - Reste (fondateur) : `DATABASE_URL` (Transaction pooler, 6543) dans Vercel → Production avant la prochaine fusion vers `main`.
  - Pour U14 : deux envois simultanés du même extrait avant sa mise en cache appellent deux fois l'IA (écriture unique). Surcoût rare (début de diffusion d'un clip viral), borné par le plafond de dépense ; envisager un verrou court par empreinte si les mesures le justifient.

- U08 — Client TMDB et rapprochement (plan validé le 15 octobre 2026 : `context/plans/U08.md`). D2 ouverte : licence commerciale à demander par le fondateur.
  - Fait (15 octobre 2026) : `CatalogProvider` / `TmdbCatalog` (recherche multi, détails avec repli du synopsis en anglais, configuration des images), client TMDB (délai, nouvelle tentative, zod), cache Upstash 7 jours, rapprochement pur (titre fr / en / original, année ±1, type, popularité) toujours en `fr-FR` + `en-US`. Variables TMDB et Upstash obligatoires en production. 20 titres réels retrouvés en direct (`npm run test:tmdb`), titre inventé sans correspondance. Relecture et audit faits : motif `not_found` distinct (une réponse invalide n'est plus mise en cache comme fiche absente), synopsis anglais demandé seulement si le français est vide. 164 tests unitaires.
  - Reste (fondateur) : `TMDB_API_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` dans Vercel → Production ; confirmer la région Upstash (eu-west-1) ; demande de licence commerciale TMDB (D2).

- U07 — Couche IA et adaptateur OpenAI (plan validé le 15 octobre 2026 : `context/plans/U07.md`).
  - Fait (15 octobre 2026) : `VisionProvider` / `OpenAIVisionProvider` (API Responses, sortie structurée revalidée par zod, `store: false`), consigne `identify.v1`, 3 tentatives (0,5 s puis 1,5 s) sur panne passagère, 12 s par tentative, refus et réponse non conforme en erreur, coût en micro-euros de chaque tentative facturée (tarifs datés, `USD_TO_EUR` BCE), modèle sans tarif refusé, garde ESLint (invariant 2). 22 tests simulés ; appels réels (`npm run test:ai`) : réponse conforme, film du domaine public reconnu, 0,002 € par appel.
  - Pour U14 : brancher la garde de dépense autour de `identify` ; `VisionError.costMicroEur` porte le coût déjà facturé d'un échec.

## Next Up

- U04 — Authentification email et Google (dépend de D8 : nom commercial et domaine).

## Open Questions

| # | Question | Bloque | Proposition |
| --- | --- | --- | --- |
| Q1 | Quelle entité encaisse et quel prestataire de paiement ? Stripe n'est pas disponible directement au Togo selon des sources secondaires. | U22 | Marchand de référence (Paddle ou Lemon Squeezy) : gère la TVA UE, compatible avec une entité hors UE. À vérifier auprès d'eux. |
| Q2 | Licence commerciale TMDB obtenue ? Délai ? | U08, U15 | Demander maintenant. Plan B : Watchmode / OMDb. |
| Q3 | « Où regarder » : TMDB watch/providers (attribution JustWatch) suffit-il contractuellement pour un usage commercial ? | U16 | Le demander à TMDB en même temps que Q2. |
| Q4 | Quel modèle de vision OpenAI, quel niveau de détail d'image, quel accord de traitement des données (transfert hors UE) ? | U07 | Trancher par `npm run eval` sur 2 modèles × 2 niveaux de détail. |
| Q5 | Où stocker légalement les 100 clips de test (contenus protégés) ? | U13 | Hors dépôt, stockage privé, usage interne de test uniquement ; à confirmer par un juriste. |
| Q9 | Le budget MVP (12 008 USD) couvre-t-il les salaires ? (CDC section 23) | Recrutement | À trancher par le fondateur avant novembre. |
| Q10 | Devise de facturation définitive (EUR confirmé ?) | U22 | EUR. |
| Q11 | Nom commercial et domaine (nécessaires pour OAuth Google, emails, pages légales) | U04, U23, U27 | Nom provisoire utilisable en préproduction. |
| Q14 | Faut-il un email confirmé avant la première identification d'un compte ? | U04, U11 | Non : l'utilisateur non confirmé garde le quota visiteur jusqu'à confirmation. |
| Q15 | RGPD : registre des traitements, base légale, statut auprès de l'IPDCP (Togo) | Lancement | Avis juridique avant la bêta (CDC 18.2). |
| Q16 | Combien de temps garder les images d'un signalement consenti ? (RG8 ne fixe pas de durée) | U20, U30 | Jusqu'à la revue admin, puis 12 mois si ajoutées au jeu de test, sinon suppression. |
| Q18 | RG14 : que couvre « données conservées 30 jours après la fin de l'abonnement » ? Et que devient une liste de plus de 100 titres quand le Premium prend fin ? | U18, U22 | Liste conservée en entier, en lecture seule pour les ajouts tant qu'elle dépasse 100 titres. Les 30 jours visent les données de facturation. |
| Q19 | Âge minimum d'inscription (la cible commence à 16 ans ; l'âge du consentement numérique varie selon les pays) | U04, U27 | 15 ans minimum dans les CGU, à valider par un juriste. |
| Q20 | Le cookie `visitor_id` (quota visiteur) est-il un cookie strictement nécessaire, sans consentement ? | U11, U27 | Probablement oui (fonctionnement du service) ; à confirmer par un juriste. |
| Q21 | Sécurité des comptes admin sans double authentification en V1 | U25 | Admins connectés uniquement par Google, avec double authentification activée sur le compte Google. |
| Q22 | Un visiteur au quota épuisé doit-il recevoir un résultat déjà en cache ? | U11 | Non (AD-13) : paywall prévisible. |

## Architecture Decisions

| # | Décision | Pourquoi | Statut |
| --- | --- | --- | --- |
| AD-01 | Next.js 16 au lieu de 14 | Next 14 ne reçoit plus de correctifs de sécurité en octobre 2026 ; le choix « Next.js » du CDC est conservé. | Décidé (D6, 7 octobre 2026) |
| AD-02 | Node.js 24 LTS au lieu de 20 | Node 20 est en fin de vie depuis avril 2026. | Décidé (D6, 7 octobre 2026) |
| AD-03 | Monolithe Next.js (routes API), pas de service séparé | Équipe de 1 à 2 développeurs, 9 semaines (CDC 16). | Décidé (CDC) |
| AD-04 | Supabase pour Postgres + Auth + Storage, Drizzle côté serveur, RLS refus par défaut | Un seul fournisseur géré ; la base n'est jamais exposée au client. | Proposé |
| AD-05 | Les images ne sont jamais stockées, sauf signalement consenti | Respecte RG7 sans tâche de nettoyage critique ; réduit le risque juridique. | Proposé |
| AD-06 | Quota par réservation / confirmation / libération dans Redis | Respecte RG3, RG6, RG16 et évite les dépassements en cas de requêtes simultanées. | Proposé |
| AD-07 | Abstractions `VisionProvider`, `CatalogProvider`, `WatchProvider`, `BillingProvider`, `Mailer` | Aucun fournisseur critique ne doit imposer une réécriture (CDC 19). | Décidé (CDC) |
| AD-08 | Thème clair uniquement en V1 | Thème sombre prévu en V2 ; la palette imposée est plus accessible sur fond clair. | Proposé |
| AD-09 | URL des fiches en français : `/titre/{film|serie}/{tmdbId}-{slug}` | Référencement et partage. | Proposé |
| AD-10 | Textes d'interface centralisés dans `src/content/fr/` sans librairie i18n | Prépare la V2 multilingue à coût quasi nul. | Proposé |
| AD-11 | Consignes IA versionnées, `npm run eval` obligatoire avant changement | Seule façon de mesurer la précision (objectif 85 %). | Décidé |
| AD-12 | Empreintes du cache calculées côté serveur, jamais reçues du client | Une empreinte fournie par le client permettrait d'empoisonner le cache pour tous les utilisateurs. | Proposé |
| AD-13 | Ordre du flux : quota vérifié avant le cache ; le cache répond même si l'IA est en pause | Paywall prévisible ; continuité de service quand le plafond IA est atteint. | Proposé |
| AD-14 | Vocabulaire de classes = celui de shadcn/ui + tokens du projet | Un seul système de noms ; évite les conflits avec le CSS généré par shadcn. | Décidé |
| AD-15 | Authentification via Server Actions (pas d'appel direct du navigateur à Supabase) | Permet notre limitation de débit (CDC 18.1). | Proposé |
| AD-16 | Plans `/architect` enregistrés dans `context/plans/<ID>.md` | Le plan survit à la fin de session ; `/review` et `/audit` s'y réfèrent. | Décidé |
| AD-17 | Eval exécutée sans cache ni quota, sur l'environnement de développement | Sinon la deuxième exécution mesurerait le cache, pas le modèle. | Décidé |
| AD-19 | Plans gratuits Vercel et Supabase en développement et préproduction ; Vercel Pro et Supabase Pro activés pour la production avant le lancement | Le plan Vercel Hobby interdit l'usage commercial ; inutile de payer avant le lancement. | Décidé (D9, 7 octobre 2026) |
| AD-20 | Valeurs initiales : visiteur 3 identifications/jour (RG2), plafond Premium 100/jour (RG4), plafond de dépense IA 10 EUR/jour pendant la bêta | Propositions Q6, Q7, Q8 acceptées ; revues après 2 semaines de mesures. | Décidé (D7, 7 octobre 2026) |
| AD-21 | TypeScript 6.0.3 et ESLint 9.39.5 (pas TS 7 ni ESLint 10) | `typescript-eslint` exige `typescript <6.1.0` et les plugins de `eslint-config-next` s'arrêtent à ESLint 9 (registre npm, 7 octobre 2026). À revoir quand l'outillage suivra. | Décidé (U01) |
| AD-22 | Claude commite et pousse uniquement sur `dev` (pas de branche `unit/*`) ; le fondateur ouvre les PR `dev` → `staging` → `main` | Consigne du fondateur ; chaque PR est vérifiée par la CI et le test de fumée du déploiement. | Décidé (7 octobre 2026) |
| AD-23 | Direction visuelle de l'accueil : hero sombre (`bg-inverse`) avec mosaïque de cadres d'affiches et pellicule, sections claires (étapes, grille asymétrique, tarifs, FAQ), blocs sombres de contraste, pied de page en colonnes. Cartes de section `rounded-xl`, blocs sombres `rounded-2xl`. Vouvoiement (Q13). | Références fournies par le fondateur (Netflix, Flowblox, Bankai) ; thème clair conservé (AD-08), tokens inchangés. | Décidé (U02, 7 octobre 2026) |
| AD-24 | Supabase CLI en local (Docker) ; une seule chaîne de migrations gérée par `drizzle-kit` (générées + SQL personnalisé pour RLS, `auth.users`, buckets, `app_settings`) ; migrations appliquées par workflow au push sur `staging` puis `main` (approbation) | Une seule source de vérité du schéma, testable en local et en CI, sans migration oubliée en production. | Décidé (U03, 8 octobre 2026) |
| AD-25 | Migrations rétrocompatibles uniquement (ajouter d'abord, retirer plus tard) ; le code qui utilise un nouvel élément de schéma part dans une promotion suivante | Vercel déploie le code sans attendre la migration de production (approbation manuelle) : le code doit tourner avant et après la migration. | Décidé (audit U03, 8 octobre 2026) |
| AD-26 | Suppression de compte = effacement immédiat (cascade depuis `auth.users`), fichiers Storage supprimés par le code, signalements anonymisés ; pas de cron d'effacement à J+30 | Plus simple et plus sûr pour le RGPD ; respecte « effacé sous 30 jours » (CDC 18.1). Ferme Q23 ; reste à concilier avec RG14 (Q18). | Décidé (8 octobre 2026) |
| AD-27 | Un seul projet Supabase en ligne pour la préproduction et la production (pas de projet de préproduction séparé) ; migrations appliquées uniquement depuis `main`, avec approbation | Choix du fondateur (8 octobre 2026), contre la recommandation de deux projets. Conséquences acceptées : la préproduction lit et écrit les données réelles ; une migration doit être fusionnée dans `main` avant que le code qui s'en sert soit testé sur `staging` (AD-25) ; aucun test destructif, seed ni donnée de test sur cette base. | Décidé (8 octobre 2026) |
| AD-28 | PostHog (région UE, `cookieless_mode: "always"`, utilisateurs toujours anonymes) remplace Sentry pour le suivi des erreurs et sert d'analytique ; variables d'observabilité et `CRON_SECRET` obligatoires en production seulement | Choix du fondateur (8 octobre 2026) : un seul outil, pas de bandeau cookies. Ferme Q12. Écart assumé avec le CDC, qui cite Sentry (monitoring, taux d'erreur). Source maps et alertes en U29. | Décidé (8 octobre 2026) |
| AD-29 | Cache de résultats : correspondance exacte (index unique sur l'empreinte d'extrait) et proche (`bit_count`) dans PostgreSQL, sans raccourci Redis en V1 | Une recherche par index unique coûte ≈ 1 ms ; une dépendance de moins, rien à désynchroniser. Redis reste pour quotas et limitation de débit. À revoir au-delà de ~100 000 entrées. | Décidé (U10, 15 octobre 2026) |
| AD-30 | Redis réservé au cache des réponses TMDB, aux quotas, au plafond de dépense IA et à la limitation de débit ; les sessions restent gérées par Supabase Auth (cookies HttpOnly, renouvellement, RG9) | Une copie des jetons de session dans Redis serait une seconde source de vérité à synchroniser et une surface d'attaque de plus. | Décidé (option A, 15 octobre 2026) |
| AD-31 | Modèle de vision par défaut `gpt-6.1-sol` (≈ 0,011 € par identification à 4 images), second candidat `gpt-5.6-luna` ; choix définitif par l'eval (Q4) | Reconnaître un titre demande une large culture générale ; coût sous la cible de 0,015 € (CDC 15.1). | Décidé (U07, 15 octobre 2026) |
| AD-18 | Trois branches `dev` → `staging` → `main`, promotion par PR uniquement, `hotfix/*` en exception | Demande du fondateur ; `staging` correspond à l'environnement `preview`, `main` à `production`. | Décidé |

## Eval History

| Date | Consigne | Modèle | Précision | Latence médiane / p95 | Coût moyen |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## Session Notes

- La première session de code commence par `/remember restore` (aucune mémoire attendue), puis `/architect` sur U01.
- Écarts de versions tranchés en U01 (AD-21).
- Node local en 22.21.1 : installer Node 24 (le projet l'exige).
- Un `package-lock.json` traîne dans `C:\Users\BK` (hors dépôt) ; Next l'ignore, mais il vaut mieux le supprimer s'il n'a pas d'usage.
- Protection des branches `main` et `staging` à activer dans GitHub (Settings → Rules) : PR obligatoire, checks listés dans `docs/setup-deploiement.md` (section 3).
