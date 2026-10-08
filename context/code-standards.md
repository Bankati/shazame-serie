# Code Standards

## General

- Modules petits et à responsabilité unique. Un fichier qui dépasse ~250 lignes doit être découpé.
- Corriger la cause racine, jamais empiler des contournements.
- Ne pas mélanger des préoccupations sans rapport dans un même composant, une même route ou un même service.
- Pas de code mort, pas de `console.log` laissé dans le code livré (utiliser le logger `src/server/log.ts`).
- Pas de dépendance ajoutée sans l'inscrire dans `context/library-docs.md` avec sa raison.
- Identifiants de code en anglais ; textes visibles par l'utilisateur en français, centralisés dans `src/content/fr/`.

## TypeScript

- `strict: true` et `noUncheckedIndexedAccess: true`. (`exactOptionalPropertyTypes` n'est pas activé : il crée des conflits avec les types de shadcn/ui, Drizzle et des SDK.)
- Interdit : `any`, `as unknown as`, `@ts-ignore`. `@ts-expect-error` seulement avec un commentaire qui explique pourquoi.
- Toute donnée externe (requête HTTP, réponse IA, réponse TMDB, webhook, variable d'environnement) est validée par un schéma zod avant d'être utilisée. Les types se dérivent des schémas (`z.infer`).
- Préférer les unions discriminées aux booléens multiples (`status: 'idle' | 'extracting' | 'uploading' | 'done' | 'error'`).
- Les services serveur retournent un `Result<T, AppError>` pour les erreurs attendues ; les exceptions sont réservées aux erreurs inattendues.

```ts
type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
```

## Next.js

- Composants serveur par défaut. `'use client'` uniquement quand l'interactivité navigateur l'exige (envoi du clip, extraction d'images, formulaires).
- Tout fichier de `src/server/**` commence par `import 'server-only'`. Exception : `src/server/db/schema/**`, chargé par `drizzle-kit` hors de Next (déclarations uniquement, jamais importé par un composant client).
- Les APIs de requête (`params`, `searchParams`, `cookies()`, `headers()`) sont asynchrones : toujours `await`.
- Fiches titres rendues côté serveur avec `generateMetadata` (titre, description, image Open Graph) et URL stable : `/titre/{film|serie}/{tmdbId}-{slug}`.
- Mutations : route handlers dans `src/app/api/**` (ou Server Actions pour les formulaires simples du compte), toujours avec la même validation que les routes.
- Route d'identification : `export const runtime = 'nodejs'` et `export const maxDuration` réglé selon le plan Vercel (voir `library-docs.md`).
- Images TMDB : déclarer `image.tmdb.org` dans `images.remotePatterns` et demander à TMDB la taille d'image adaptée (w185, w342, w500) ; voir `library-docs.md` pour l'optimisation d'images.
- Vérifier dans la doc de la version installée tout comportement de cache avant de s'y fier.

## Styling

- Utiliser uniquement les classes de `context/ui-context.md` (vocabulaire shadcn/ui + tokens du projet). Aucune couleur hexadécimale ni valeur arbitraire de couleur, rayon, taille de texte ou espacement (`bg-[#…]`, `rounded-[…]`, `text-[…]`, `p-[…]`). Les proportions (`aspect-[2/3]`) et largeurs de grille sont permises.
- Respecter l'échelle de rayons, d'espacements et de typographie de `ui-context.md`.
- Avant de créer un composant, consulter `context/ui-registry.md` ; après, lancer `/imprint`.
- Le vert de marque `#10B981` n'est **jamais** utilisé comme couleur de texte sur fond clair (contraste 2,5:1).
- Mobile d'abord : écrire les classes pour 360 px puis élargir avec `sm:` `md:` `lg:`.

## API Routes

- Ordre fixe dans chaque route handler **et chaque Server Action** : 1) limitation de débit, 2) parse + validation zod, 3) session et rôle, 4) propriété de la ressource, 5) appel au service, 6) réponse.
- Routes mutantes appelées par le navigateur (POST, PUT, PATCH, DELETE) : vérifier que l'en-tête `Origin` correspond au site (protection CSRF ; les Server Actions le font déjà). Exceptions : webhooks et crons, protégés par signature ou secret.
- Forme de réponse unique :

```ts
// succès
{ ok: true, data: T }
// erreur
{ ok: false, error: { code: ErrorCode, message: string } } // message en français, lisible par l'utilisateur
```

- Codes d'erreur normalisés (`src/schemas/errors.ts`) et statut HTTP associé :

| Code | HTTP | Cas |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Entrée invalide |
| `UNAUTHENTICATED` | 401 | Pas de session |
| `FORBIDDEN` | 403 | Rôle ou propriété insuffisants, compte suspendu |
| `NOT_FOUND` | 404 | Ressource absente |
| `QUOTA_EXCEEDED` | 429 | Quota journalier atteint (inclure `resetAt`) |
| `RATE_LIMITED` | 429 | Trop de requêtes |
| `WATCHLIST_FULL` | 409 | 100 titres atteints en gratuit |
| `FRAMES_UNUSABLE` | 422 | Moins de 2 images exploitables |
| `AI_PAUSED` | 503 | Plafond de dépense IA atteint |
| `UPSTREAM_ERROR` | 502 | IA, TMDB ou prestataire en échec après 3 tentatives |
| `INTERNAL_ERROR` | 500 | Inattendu (envoyé à Sentry) |

- Webhooks : lire le corps brut, vérifier la signature, vérifier l'idempotence (`billing_events`), traiter, répondre 2xx rapidement.
- Jamais de détail technique (stack, SQL, réponse brute d'un fournisseur) dans un message d'erreur renvoyé au client.

## Data and Storage

- Toutes les requêtes via Drizzle (requêtes paramétrées). SQL brut uniquement via le template `sql` de Drizzle.
- Une migration par changement de schéma, nommée de façon explicite ; jamais d'édition d'une migration appliquée.
- Écritures liées (ex. action admin + journal d'audit, webhook + abonnement) dans une transaction.
- Montants en entiers : centimes pour les prix, micro-euros pour les coûts IA. Jamais de flottant pour l'argent.
- Dates en UTC en base ; conversion vers `Europe/Paris` uniquement dans `src/lib/time.ts`.
- Pas de contenu volumineux en base : images dans le stockage objet, et seulement si consenti.

## Security

- Secrets uniquement dans les variables d'environnement serveur, lus via `src/server/env.ts`.
- En-têtes de sécurité définis globalement (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, `frame-ancestors 'none'`). La CSP suit la méthode à nonce décrite dans la doc Next.js de la version installée et autorise explicitement : images `image.tmdb.org`, cadre `www.youtube-nocookie.com` (bandes-annonces), connexions Supabase, Sentry, analytique, et le domaine du prestataire de paiement si nécessaire.
- Bandes-annonces : lecteur `youtube-nocookie.com`, chargé seulement au clic.
- Contrôle du type réel des images reçues (octets magiques via `sharp`), pas seulement du type MIME annoncé.
- Limitation de débit sur : connexion, inscription, reset, identification, signalement, export.
- Les actions sensibles du compte (suppression, export) exigent une session récente ou une confirmation.

## AI Pipeline

- Les consignes vivent dans `src/server/ai/prompts/` avec un numéro de version (`identify.v1.ts`). Toute modification crée une nouvelle version et exige un `npm run eval` dont le résultat est noté dans `progress-tracker.md`.
- La réponse du modèle est demandée en JSON strict et validée par zod ; une réponse invalide compte comme un échec (tentative suivante).
- Chaque appel enregistre : fournisseur, modèle, version de consigne, latence, coût estimé.
- Les poids du score de confiance et les seuils du cache sont des constantes nommées (`src/server/identification/scoring.ts`, `src/server/identification/cache.ts`), calibrées sur le jeu de test.
- Les paramètres d'échantillonnage des images vivent dans `src/shared/frames/` et sont utilisés à la fois par le navigateur et par l'eval, pour que l'eval mesure ce que vivent les utilisateurs.

## Testing

- Vitest pour toute la logique de `src/server/**` et `src/client/frames/**` : quota, score, cache, entitlement, règles RG.
- Playwright pour les parcours critiques : identification (IA simulée), inscription, paiement (mode test), export/suppression.
- Les fournisseurs externes sont simulés derrière leurs interfaces ; aucun test n'appelle une API payante, sauf `npm run eval`.
- Un bug corrigé = un test qui l'aurait détecté.

## Naming

- Fichiers et dossiers : `kebab-case` (`confidence-badge.tsx`, `identify-route.ts`).
- Composants React : `PascalCase`. Hooks : `useCamelCase`. Constantes : `SCREAMING_SNAKE_CASE`.
- Tables et colonnes SQL : `snake_case` pluriel pour les tables.
- Routes publiques en français (`/titre`, `/tarifs`, `/compte/liste`) ; routes API en anglais (`/api/identify`, `/api/watchlist`).

## Git

- Trois branches permanentes : `dev` (intégration), `staging` (préproduction), `main` (production). Dépôt : https://github.com/Bankati/shazame-serie
- L'agent commite et pousse **uniquement sur `dev`** (AD-22) : pas de branche par unité, pas de PR ouverte par l'agent, jamais de push sur `staging` ni `main`. Le fondateur ouvre les PR `dev` → `staging` → `main`.
- Promotion uniquement par PR : `dev` → `staging` → `main`. Correctif urgent : `hotfix/*` vers `staging` ou `main`, puis reporté dans `dev`. Le workflow `branch-flow` refuse toute autre source.
- Commits conventionnels en anglais : `feat(identification): add cache lookup by fingerprint`.
- Un commit ne mélange pas deux unités. La CI (`.github/workflows/ci.yml` : lint, typecheck, test, build, audit des dépendances de production, absence de fichiers de secrets) et le test de fumée du déploiement (`.github/workflows/smoke.yml`) doivent être verts avant fusion.

## File Organization

- `src/app/` — routes et pages uniquement, minces.
- `src/components/ui/` — shadcn/ui généré (protégé).
- `src/components/<feature>/` — composants d'une fonctionnalité.
- `src/client/` — code exécuté seulement dans le navigateur (extraction d'images).
- `src/shared/` — code pur partagé navigateur / serveur / eval.
- `src/server/<domain>/` — logique métier et accès aux données, `server-only`.
- `src/schemas/` — schémas zod partagés et codes d'erreur.
- `src/content/fr/` — textes d'interface.
- `src/lib/` — utilitaires purs.
- `eval/` — jeu de test d'identification (manifeste, pas les vidéos).
- `drizzle/` — migrations générées.
- `tests/e2e/` — tests Playwright.
- `tests/db/` — tests d'intégration contre la pile Supabase locale (`npm run test:db`).
- `scripts/` — outils du dépôt (seed local, contrôle du design system).
- `context/plans/` — plans validés par `/architect`.
