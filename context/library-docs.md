# Library Docs

Référence des librairies et services utilisés, de leurs versions et des pièges connus pour **ce** projet.

## Règles

1. **Ne pas se fier à la mémoire pour une API.** Plusieurs librairies ont changé de version majeure récemment (Next 16, React 19, Zod 4, Tailwind 4, TypeScript 7). Avant d'utiliser une API, ouvrir la documentation officielle de la version installée (lien ci-dessous) ou les types dans `node_modules`.
2. Versions **exactes** dans `package.json` (pas de `^`), mises à jour volontairement, une librairie à la fois, avec la CI verte.
3. Toute nouvelle dépendance est ajoutée à ce fichier avec : rôle, raison, alternative écartée.
4. Les points marqués « À vérifier » doivent être confirmés dans la doc officielle au moment de l'unité concernée, puis ce fichier est mis à jour.

## Versions de référence

Relevées sur le registre npm le **4 octobre 2026**, révisées en U01 le **7 octobre 2026** (versions installées : `package.json`).

| Paquet | Version | Rôle |
| --- | --- | --- |
| `next` | 16.3.8 | Framework |
| `react` / `react-dom` | 19.3.0 (installé) | UI |
| `typescript` | 6.0.3 (installé, AD-21) | Typage (voir note) |
| `tailwindcss` | 4.3.3 | Styles |
| `shadcn` (CLI) | 4.21.1 | Génération des composants UI |
| `lucide-react` | 1.52.0 | Icônes |
| `react-hook-form` | 7.89.0 | Formulaires |
| `@hookform/resolvers` | 5.9.1 | Pont zod ↔ react-hook-form |
| `zod` | 4.6.5 (installé) | Validation |
| `drizzle-orm` / `drizzle-kit` | 0.45.3 / 0.31.11 | ORM et migrations |
| `postgres` | 3.4.9 | Pilote PostgreSQL pour Drizzle |
| `@supabase/supabase-js` | 2.117.2 | Auth, Storage |
| `@supabase/ssr` | 0.12.7 | Sessions Supabase par cookies dans Next |
| `openai` | 7.28.0 | SDK du fournisseur de vision (uniquement dans `src/server/ai/`) |
| `@upstash/redis` | 1.39.0 | Redis REST |
| `@upstash/ratelimit` | 2.2.0 | Limitation de débit |
| `sharp` | 0.35.5 | Contrôle du type réel et dimensions des images côté serveur |
| `stripe` | 23.0.0 | Si D1 = Stripe |
| `@paddle/paddle-node-sdk` | 3.10.0 | Si D1 = Paddle |
| `resend` | 6.32.0 | Emails |
| `@react-email/components` | 1.0.12 | Gabarits d'emails |
| `@sentry/nextjs` | 11.5.0 (installé) | Erreurs |
| `posthog-js` | 1.435.8 | Analytique (si retenu plutôt que Plausible) |
| `vitest` | 5.0.3 | Tests unitaires |
| `server-only` | 0.0.1 (installé) | Empêche l'import d'un module serveur côté client |
| `ffmpeg-static` | 5.3.0 | Extraction d'images dans le harnais `eval/` uniquement (dépendance de développement) |
| `@types/node` | 24.19.1 | Types alignés sur le runtime Node 24 (ne pas prendre la dernière majeure) |
| `eslint` / `typescript-eslint` | 9.39.5 (installé, AD-21) / via `eslint-config-next` | Lint |
| `@playwright/test` | 1.63.0 | Tests bout en bout |

Runtime : **Node.js 24 LTS** (Node 20, cité par le CDC, est en fin de vie depuis avril 2026). Vérifier la version proposée par Vercel dans les réglages du projet et fixer `engines.node` dans `package.json`.

Plans d'hébergement : **Vercel Pro** obligatoire (le plan Hobby est réservé à l'usage non commercial et limite les crons) ; **Supabase payant** en production (le plan gratuit met les projets en pause après inactivité, et certains réglages de session en dépendent). À intégrer au budget (Q17).

---

## Next.js 16 (App Router)

- Doc : https://nextjs.org/docs
- Usage ici : pages SSR des fiches (`generateMetadata`), route handlers pour l'API, Server Components par défaut.
- Pièges / à vérifier :
  - `params`, `searchParams`, `cookies()`, `headers()` sont **asynchrones** (`await`).
  - Route handlers `GET` dynamiques par défaut depuis Next 15 (vérifié dans la doc installée).
  - `global-error.tsx` reçoit `{ error, retry }` (et non plus `reset`) dans la version installée.
  - Le fichier `middleware.ts` a été renommé `proxy.ts` dans les versions récentes : **à vérifier** dans la doc de la version installée avant U04.
  - Le modèle de cache a évolué entre 14, 15 et 16 (cache désactivé par défaut pour `fetch`, directives de cache explicites). Ne jamais supposer qu'une réponse est mise en cache : lire la page « Caching » de la version installée.
  - Route d'identification : définir `export const runtime = 'nodejs'` (sharp ne tourne pas en edge) et `export const maxDuration` (limites selon le plan Vercel : https://vercel.com/docs/functions/limitations).
  - Corps de requête des fonctions Vercel limité (de l'ordre de 4,5 Mo) : c'est pour cela que l'on envoie ≤ 1,5 Mo d'images.
  - `next/image` avec les affiches TMDB : l'optimisation d'images Vercel est facturée à l'usage. Comme TMDB sert déjà des tailles prédéfinies (w185, w342, w500…), envisager `unoptimized` pour ces images et choisir la bonne taille TMDB. À trancher en U15.
  - CSP à nonce : suivre la page « Content Security Policy » de la doc de la version installée ; une CSP à nonce rend les pages dynamiques.

## React 19

- Doc : https://react.dev
- `useActionState`, `useOptimistic` (ajout optimiste à la liste de suivi), `use()`. Pas de `forwardRef` nécessaire pour les nouveaux composants (ref en prop) — vérifier ce que génère shadcn.

## TypeScript

- Doc : https://www.typescriptlang.org/docs/
- **Décidé en U01 (AD-21)** : TypeScript **6.0.3**, pas 7. `typescript-eslint` (embarqué par `eslint-config-next`) exige `typescript >=4.8.4 <6.1.0`. ESLint reste en **9.39.5** : `eslint-plugin-react`, `-import` et `-jsx-a11y` s'arrêtent à ESLint 9. Dependabot ignore ces majeures (`.github/dependabot.yml`) ; revoir quand l'outillage suivra.

## Tailwind CSS 4

- Doc : https://tailwindcss.com/docs
- Configuration **dans le CSS** (`@import "tailwindcss"`, `@theme`), plus de `tailwind.config.js` par défaut. Tokens : voir `ui-context.md`.
- Classes arbitraires `bg-[#...]` interdites par nos standards.

## shadcn/ui

- Doc : https://ui.shadcn.com/docs (section Tailwind v4)
- Ajouter avec `npx shadcn@latest add <composant>`. Ne pas modifier `src/components/ui/*` à la main : composer dans `src/components/<feature>/`.

## Zod 4

- Doc : https://zod.dev (guide de migration v3 → v4 : https://zod.dev/v4/changelog)
- Pièges : plusieurs formats sont devenus des fonctions de premier niveau (`z.email()`, `z.url()`…), la personnalisation des messages d'erreur a changé. Messages d'erreur en français.
- Utiliser les mêmes schémas côté client (formulaires) et serveur (routes).

## react-hook-form

- Doc : https://react-hook-form.com
- Avec `zodResolver` de `@hookform/resolvers` ; vérifier la compatibilité Zod 4 de la version installée.

## Drizzle ORM + PostgreSQL (Supabase)

- Doc : https://orm.drizzle.team/docs/overview — Supabase : https://orm.drizzle.team/docs/connect-supabase
- Connexion via le **pooler** Supabase en mode transaction pour les fonctions serverless : désactiver les requêtes préparées (`prepare: false` avec le pilote `postgres`).
- Migrations : `drizzle-kit generate` puis `drizzle-kit migrate`. Jamais `push` en production.
- Distance de Hamming pour le cache : dHash stockés en `bigint`, distance = `bit_count((a # b)::bit(64))` (`#` = XOR, `bit_count` existe depuis PostgreSQL 14). À valider en U10, y compris la conversion des valeurs 64 bits signées entre JavaScript (`BigInt`) et PostgreSQL.

## Supabase Auth et Storage

- Auth côté serveur avec Next : https://supabase.com/docs/guides/auth/server-side/nextjs
- Google : https://supabase.com/docs/guides/auth/social-login/auth-google
- Storage : https://supabase.com/docs/guides/storage — URL signées : https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
- Pièges :
  - Côté serveur, valider l'utilisateur avec `auth.getUser()` (appel vérifié), pas avec la session lue dans le cookie.
  - La clé `service_role` contourne la RLS : uniquement dans `src/server/`, jamais dans une variable `NEXT_PUBLIC_*`.
  - Emails d'auth : configurer le SMTP personnalisé (Resend) et traduire les gabarits en français dans le tableau de bord Supabase.
  - RG9 (30 jours d'inactivité) : réglage « inactivity timeout » des sessions Supabase, **à vérifier** selon le plan (cette option n'est pas disponible sur tous les plans). Sinon, mettre en œuvre la règle côté application (date de dernière activité).
  - RG10 (lien valable 24 h) : réglage de l'expiration des liens / OTP email (exprimé en secondes, 86 400).
  - Mot de passe de 8 caractères minimum : réglage dans le tableau de bord Supabase.
  - Limites de débit propres à Supabase Auth (envoi d'emails notamment) : les relever avant la bêta.

## OpenAI (vision)

- Doc : https://platform.openai.com/docs/guides/images-vision — sorties structurées : https://platform.openai.com/docs/guides/structured-outputs
- Modèle lu depuis `OPENAI_VISION_MODEL` (jamais codé en dur).
- Demander une sortie conforme à un schéma JSON, puis revalider avec zod.
- Le paramètre de niveau de détail des images change fortement le coût et la précision : à comparer dans `npm run eval` (U13) avant de fixer la valeur.
- Envoyer les images en base64 dans la requête (elles ne sont pas stockées chez nous, RG7).
- Coût : calculé à partir des jetons consommés renvoyés dans la réponse et des tarifs du modèle (en USD), converti en micro-euros par une constante révisée chaque mois.
- Vérifier les conditions de conservation des données côté fournisseur et l'accord de traitement (D4).

## TMDB API v3

- Doc : https://developer.themoviedb.org/docs — référence : https://developer.themoviedb.org/reference/intro/getting-started
- Usage : `search/movie`, `search/tv`, `movie/{id}`, `tv/{id}` avec `append_to_response=credits,videos,similar,recommendations`, `configuration` pour les URL d'images. Toujours `language=fr-FR`, repli sur `en-US` si synopsis vide.
- Où regarder : `movie/{id}/watch/providers` et `tv/{id}/watch/providers` (données fournies par JustWatch, **attribution JustWatch obligatoire**). Licence commerciale TMDB requise (D2).
- Mention obligatoire et logo : https://www.themoviedb.org/about/logos-attribution
- Respecter les limites de débit et mettre en cache selon leurs conditions.

## Watchmode (secours pour « où regarder »)

- Doc : https://api.watchmode.com/docs — utilisé seulement si D3 l'impose.

## Upstash Redis et Ratelimit

- Doc : https://upstash.com/docs/redis/overall/getstarted — Ratelimit : https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- Quota : `INCR` + `EXPIREAT` sur la clé du jour (minuit Europe/Paris), réservation puis confirmation/libération (`DECR`) pour éviter les dépassements en cas de requêtes simultanées.

## Paiement (selon D1)

- Stripe Billing : https://docs.stripe.com/billing/subscriptions/overview — Checkout : https://docs.stripe.com/payments/checkout — Webhooks : https://docs.stripe.com/webhooks — Portail client : https://docs.stripe.com/customer-management — pays pris en charge : https://stripe.com/global
- Paddle (marchand de référence, gère la TVA) : https://developer.paddle.com
- Lemon Squeezy (marchand de référence) : https://docs.lemonsqueezy.com
- Dans tous les cas : page de paiement hébergée, webhook avec corps brut (`await req.text()`) et vérification de signature, idempotence par identifiant d'événement, aucune donnée de carte chez nous.
- À noter pour D1 : un marchand de référence collecte et reverse la TVA européenne à la place de l'entreprise, ce qui simplifie fortement la situation d'un fondateur basé au Togo vendant en France, Belgique et Suisse.

## Resend + React Email

- Doc : https://resend.com/docs — https://react.email/docs
- Domaine d'envoi vérifié (SPF, DKIM, DMARC) avant U23.

## Sentry

- Doc : https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- Fichiers (U01) : `src/instrumentation.ts` (`register` + `onRequestError = Sentry.captureRequestError`), `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/instrumentation-client.ts` (`onRouterTransitionStart`), `src/app/global-error.tsx`, `withSentryConfig` importé depuis **`@sentry/nextjs/config`** dans `next.config.ts`.
- **Piège v11** : `sendDefaultPii` n'existe plus, remplacé par `dataCollection`, qui collecte **par défaut** utilisateur, cookies, en-têtes, corps HTTP, paramètres d'URL et variables locales. Tout est coupé dans `src/shared/observability/sentry.ts` ; `beforeSend: scrubEvent` (testé) sert de seconde barrière (emails masqués).
- Pas de Session Replay ni de widget de retour (Q15). `telemetry: false` sur le plugin de build.
- Source maps envoyées seulement si `SENTRY_AUTH_TOKEN` est défini (build Vercel) ; en CI, l'avertissement « No auth token provided » est normal.

## Analytique

- PostHog : https://posthog.com/docs/libraries/next-js — Plausible : https://plausible.io/docs
- Choix ouvert. Pas d'identifiant personnel dans les événements ; consentement si cookies non essentiels.

## Vercel

- Limites des fonctions : https://vercel.com/docs/functions/limitations — Crons : https://vercel.com/docs/cron-jobs — en-têtes de géolocalisation : https://vercel.com/docs/headers/request-headers

## APIs navigateur pour l'extraction d'images

- `HTMLVideoElement` : https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
- `requestVideoFrameCallback` : https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- `HTMLCanvasElement.toBlob` : https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- Pièges :
  - Safari iOS : vidéo `muted` + `playsInline`, attendre `loadedmetadata` avant de lire la durée, puis l'événement `seeked` après chaque `currentTime`.
  - Certains MOV (HEVC) ne se décodent pas dans Chrome sur tous les appareils : intercepter l'erreur et proposer un autre format.
  - Libérer la mémoire : `URL.revokeObjectURL` après extraction.
  - Échantillonner en évitant le tout début et la toute fin (fondus au noir, logos).

## ffmpeg-static (eval uniquement)

- Doc : https://ffmpeg.org/ffmpeg.html — paquet : https://www.npmjs.com/package/ffmpeg-static
- Appeler le binaire par `child_process.spawn` (ne pas utiliser `fluent-ffmpeg`, qui n'est plus maintenu). Réutiliser les instants d'échantillonnage de `src/shared/frames/` pour reproduire l'extraction du navigateur.

## sharp

- Doc : https://sharp.pixelplumbing.com
- Côté serveur : lire les métadonnées pour vérifier le format réel (JPEG) et les dimensions, rejeter le reste. Calculer les dHash (redimensionnement 9 × 8 en niveaux de gris). Runtime Node uniquement.

## Vitest et Playwright

- https://vitest.dev — https://playwright.dev
- Vitest 5.0.3 installé (4 octobre 2026) pour la CI. Exige `@types/node` ^22 ou ≥ 24 (d'où l'alignement sur 24.19.1) et Node ^22.12 ou ^24. Configuration : `vitest.config.mts` (extension `.mts` pour éviter l'avertissement « ESM syntax in a file loaded as CommonJS » de Vite ; alias `@` → `src`, environnement `node`). `--passWithNoTests` retiré en U01.
- `server-only` lève une erreur hors de la condition `react-server` : Vitest l'aliase vers `server-only/empty.js` pour pouvoir tester `src/server/**`.
- Audit en CI limité aux dépendances de production (`npm audit --omit=dev --audit-level=high`) : au 4 octobre 2026, `braces` (dépendance de développement) remonte 5 alertes « high » sans correctif non cassant.
- Playwright : profils mobile (Pixel, iPhone) en plus du desktop.
