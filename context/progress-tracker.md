# Progress Tracker

Mettre à jour ce fichier après chaque changement d'implémentation significatif.

## Current Phase

- Phase 0 — Décisions bloquantes (jusqu'au 31 octobre 2026). Squelette `create-next-app` présent ; aucune unité commencée formellement.

## Current Goal

- Fermer les décisions D1 à D9 de `build-plan.md`, en priorité D1 (paiement) et D4 (accès OpenAI), qui sont sur le chemin critique.

## Completed

- Cahier des charges V4 rédigé (1er octobre 2026), converti en `docs/cahier-des-charges-v4.md`.
- Fichiers de contexte et skills du projet créés (4 octobre 2026), puis relus intégralement et corrigés (cohérence entre fichiers, vocabulaire shadcn/ui, sécurité du cache, dépendances du build plan).
- Dépôt GitHub `Bankati/shazame-serie` branché, branches `dev` / `staging` / `main`, CI GitHub Actions (lint, typecheck, test Vitest, build, audit production), contrôle du sens de promotion, Dependabot vers `dev` (4 octobre 2026). Partie « CI » de U01 en avance ; restent pour U01 : structure de dossiers, `env.ts`, Vercel, Sentry.

## In Progress

- Aucune unité en cours.

## Next Up

- U01 — Socle du dépôt et déploiement (dès que D6 est validée).

## Open Questions

| # | Question | Bloque | Proposition |
| --- | --- | --- | --- |
| Q1 | Quelle entité encaisse et quel prestataire de paiement ? Stripe n'est pas disponible directement au Togo selon des sources secondaires. | U22 | Marchand de référence (Paddle ou Lemon Squeezy) : gère la TVA UE, compatible avec une entité hors UE. À vérifier auprès d'eux. |
| Q2 | Licence commerciale TMDB obtenue ? Délai ? | U08, U15 | Demander maintenant. Plan B : Watchmode / OMDb. |
| Q3 | « Où regarder » : TMDB watch/providers (attribution JustWatch) suffit-il contractuellement pour un usage commercial ? | U16 | Le demander à TMDB en même temps que Q2. |
| Q4 | Quel modèle de vision OpenAI, quel niveau de détail d'image, quel accord de traitement des données (transfert hors UE) ? | U07 | Trancher par `npm run eval` sur 2 modèles × 2 niveaux de détail. |
| Q5 | Où stocker légalement les 100 clips de test (contenus protégés) ? | U13 | Hors dépôt, stockage privé, usage interne de test uniquement ; à confirmer par un juriste. |
| Q6 | Valeur RG2 (visiteur) : 3 par jour ? | U11 | 3 par jour, par cookie signé + limite IP. |
| Q7 | Valeur RG4 (plafond Premium anti-abus) ? | U11 | 100 par jour au départ, revu après 2 semaines de mesures. |
| Q8 | Plafond de dépense IA quotidien initial ? | U14 | 10 EUR/jour pendant la bêta, revu chaque semaine. |
| Q9 | Le budget MVP (12 008 USD) couvre-t-il les salaires ? (CDC section 23) | Recrutement | À trancher par le fondateur avant novembre. |
| Q10 | Devise de facturation définitive (EUR confirmé ?) | U22 | EUR. |
| Q11 | Nom commercial et domaine (nécessaires pour OAuth Google, emails, pages légales) | U04, U23, U27 | Nom provisoire utilisable en préproduction. |
| Q12 | Analytique : PostHog ou Plausible ? | U29 | Plausible si l'on veut éviter tout bandeau cookies ; PostHog si l'on veut des entonnoirs détaillés. |
| Q13 | Vouvoiement ou tutoiement dans l'interface ? | U02 | Vouvoiement. |
| Q14 | Faut-il un email confirmé avant la première identification d'un compte ? | U04, U11 | Non : l'utilisateur non confirmé garde le quota visiteur jusqu'à confirmation. |
| Q15 | RGPD : registre des traitements, base légale, statut auprès de l'IPDCP (Togo) | Lancement | Avis juridique avant la bêta (CDC 18.2). |
| Q16 | Combien de temps garder les images d'un signalement consenti ? (RG8 ne fixe pas de durée) | U20, U30 | Jusqu'à la revue admin, puis 12 mois si ajoutées au jeu de test, sinon suppression. |
| Q17 | Budget des plans payants : Vercel Pro (le plan Hobby interdit l'usage commercial) et Supabase payant en production | U01 | À ajouter au budget du MVP (D9). |
| Q18 | RG14 : que couvre « données conservées 30 jours après la fin de l'abonnement » ? Et que devient une liste de plus de 100 titres quand le Premium prend fin ? | U18, U22 | Liste conservée en entier, en lecture seule pour les ajouts tant qu'elle dépasse 100 titres. Les 30 jours visent les données de facturation. |
| Q19 | Âge minimum d'inscription (la cible commence à 16 ans ; l'âge du consentement numérique varie selon les pays) | U04, U27 | 15 ans minimum dans les CGU, à valider par un juriste. |
| Q20 | Le cookie `visitor_id` (quota visiteur) est-il un cookie strictement nécessaire, sans consentement ? | U11, U27 | Probablement oui (fonctionnement du service) ; à confirmer par un juriste. |
| Q21 | Sécurité des comptes admin sans double authentification en V1 | U25 | Admins connectés uniquement par Google, avec double authentification activée sur le compte Google. |
| Q22 | Un visiteur au quota épuisé doit-il recevoir un résultat déjà en cache ? | U11 | Non (AD-13) : paywall prévisible. |

## Architecture Decisions

| # | Décision | Pourquoi | Statut |
| --- | --- | --- | --- |
| AD-01 | Next.js 16 au lieu de 14 | Next 14 ne reçoit plus de correctifs de sécurité en octobre 2026 ; le choix « Next.js » du CDC est conservé. | Proposé — valider (D6) |
| AD-02 | Node.js 24 LTS au lieu de 20 | Node 20 est en fin de vie depuis avril 2026. | Proposé — valider (D6) |
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
| AD-18 | Trois branches `dev` → `staging` → `main`, promotion par PR uniquement, `hotfix/*` en exception | Demande du fondateur ; `staging` correspond à l'environnement `preview`, `main` à `production`. | Décidé |

## Eval History

| Date | Consigne | Modèle | Précision | Latence médiane / p95 | Coût moyen |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## Session Notes

- La première session de code commence par `/remember restore` (aucune mémoire attendue), puis `/architect` sur U01.
- Écarts de versions avec `library-docs.md` à trancher en U01 : TypeScript 5.9.3 installé (7.0.2 « à vérifier »), React 19.2.8 (19.3.0), ESLint 9.39.5 (10.12.0). Node local en 22 alors que le projet et la CI exigent Node 24.
- Protection des branches `main` et `staging` à activer dans GitHub (Settings → Rules) : PR obligatoire, checks « Lint, typecheck, test, build », « Audit des dépendances de production » et « Vérifier la branche source ».
