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
| `@supabase/supabase-js` | 2.117.3 | Auth, Storage |
| `@supabase/ssr` | 0.12.7 | Sessions Supabase par cookies dans Next |
| `openai` | 7.34.0 (installé) | SDK du fournisseur de vision (uniquement dans `src/server/ai/`, règle ESLint) |
| `@upstash/redis` | 1.39.0 | Redis REST |
| `@upstash/ratelimit` | 2.2.0 | Limitation de débit |
| `sharp` | 0.35.5 | Contrôle du type réel et dimensions des images côté serveur |
| `stripe` | 23.0.0 | Si D1 = Stripe |
| `@paddle/paddle-node-sdk` | 3.10.0 | Si D1 = Paddle |
| `resend` | 6.32.0 | Emails |
| `@react-email/components` | 1.0.12 | Gabarits d'emails |
| `posthog-js` | 1.438.3 (installé) | Erreurs et analytique navigateur (AD-28) |
| `posthog-node` | 5.55.1 (installé) | Erreurs serveur (AD-28) |
| `vitest` | 5.0.3 | Tests unitaires |
| `server-only` | 0.0.1 (installé) | Empêche l'import d'un module serveur côté client |
| `ffmpeg-static` | 5.3.0 | Extraction d'images dans le harnais `eval/` uniquement (dépendance de développement) |
| `@types/node` | 24.19.1 | Types alignés sur le runtime Node 24 (ne pas prendre la dernière majeure) |
| `eslint` / `typescript-eslint` | 9.39.5 (installé, AD-21) / via `eslint-config-next` | Lint |
| `@playwright/test` | 1.63.0 | Tests bout en bout |

Lockfile (piège rencontré en U01) : un `package-lock.json` écrit par npm 11.6 sous Windows omettait des dépendances WASM optionnelles (`@emnapi/runtime`, `@emnapi/core`) ; npm 11.19, livré avec Node 24.21 sur la CI, refuse alors `npm ci` (« Missing … from lock file »). Toujours modifier les dépendances avec le npm de Node 24 (ou `npx npm@<version de la CI> install`), et contrôler avant de pousser avec `npx npm@<version> ci --dry-run`.

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

## Motion et Embla (animations et carrousels, AD-36)

- Installés le 16 octobre 2026 : `motion` **13.5.1** (la 14 venait de sortir : non retenue), `embla-carousel-react` / `-autoplay` / `-fade` **8.6.0**.
- Motion : importer depuis `motion/react`. On utilise `LazyMotion features={domAnimation} strict` (dans `MotionProvider`) : seuls les composants `m.*` sont autorisés, `motion.*` lèverait une erreur. `MotionConfig reducedMotion="user"`. API vérifiées dans les types installés : `AnimatePresence`, `useReducedMotion`, `whileInView` + `viewport`, variantes, `layout`.
- Embla : `useEmblaCarousel(options, plugins)` renvoie `[ref, api]` ; l'événement `init` est déjà passé quand `api` arrive (lire l'état à l'image suivante). Greffon `Autoplay` : ne jamais appeler `play()` / `stop()` avant que `api` existe (erreur « reading 'internalEngine' », rencontrée). `Fade()` pour la vedette ; les diapositives restent empilées, donc monter les images au fur et à mesure (sinon toutes se chargent).
- Les composants clients peuvent importer des **types** depuis `src/server/**` (`import type`, effacé à la compilation), jamais des valeurs.

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

- Installé en U02 : CLI `shadcn` 4.21.4 (dépendance de **développement** : seul `shadcn/tailwind.css` est importé, au build), base **Radix** (`radix-ui` 1.7.0), preset **`radix-nova`** (`components.json`). `init` non interactif : `npx shadcn@4.21.4 init --base radix --preset nova --template next --no-monorepo --no-rtl --pointer -y`.
- Dépendances ajoutées par la CLI (épinglées) : `class-variance-authority` 0.7.1, `cn` 0.4.0 (paquet officiel shadcn qui remplace `clsx` + `tailwind-merge`), `lucide-react` 1.52.0, `tw-animate-css` 1.4.0, `sonner` 2.0.8, `next-themes` 0.4.6 (requis par le Toaster).
- Pièges : la CLI écrit des versions `^` (à épingler) ; le preset Nova génère des boutons de 32 px (poser `h-11`) ; le `Sheet` a un bouton de fermeture libellé « Close » (utiliser `showCloseButton={false}` + bouton français) ; le `Toaster` suit le thème du système via `next-themes` (passer `theme="light"`) ; les composants contiennent des classes `dark:` : garder `@custom-variant dark (&:is(.dark *))` dans `globals.css`, sinon Tailwind 4 les applique selon le mode sombre du système. `init` remplace la police par Geist dans le layout : à retirer.
- Composants générés : button, input, label, dialog, sheet, sonner, skeleton, badge, accordion.

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
- **Pooler en mode transaction (port 6543) : les paramètres envoyés à la connexion sont ignorés** (`connection: { statement_timeout }` de postgres.js reste sans effet, délai réel 2 min ; vérifié le 15 octobre 2026). Délai par requête : `withQueryTimeout(db, (tx) => …)` dans `src/server/db/client.ts` (`SET LOCAL statement_timeout` dans une transaction, 5 s par défaut, erreur 57014). Ne jamais y placer d'appel externe long.
- Région : fonctions Vercel en `dub1` (Dublin, `vercel.json`), même région que la base Supabase `eu-west-1`. Depuis `iad1` (défaut Vercel), chaque aller-retour traverserait l'Atlantique.
- Connexion via le **pooler** Supabase en mode transaction pour les fonctions serverless : désactiver les requêtes préparées (`prepare: false` avec le pilote `postgres`). Client applicatif : `getDb()` dans `src/server/db/client.ts` (U10), une connexion par instance, `DATABASE_URL` obligatoire en production.
- `db.execute(sql…)` avec postgres-js renvoie directement le tableau de lignes. Pour un tableau d'entiers en paramètre : littéral `{1,2,3}` passé en paramètre puis `::bigint[]` (voir `result-cache.ts`).
- Migrations : `drizzle-kit generate` puis `drizzle-kit migrate`. Jamais `push` en production.
- Installé en U03 : `drizzle-orm` 0.45.3, `drizzle-kit` 0.31.11, `postgres` 3.4.9, `tsx` 4.23.15 (scripts). `.enableRLS()` sur chaque table et `authUsers` (`drizzle-orm/supabase`) pour la clé étrangère `profiles.id → auth.users.id`. `schemaFilter: ["public"]` dans `drizzle.config.ts` : `auth` et `storage` restent à Supabase.
- Migrations SQL personnalisées : `drizzle-kit generate --custom --name <nom>`, puis écrire le SQL (séparer les instructions par `--> statement-breakpoint`).
- `drizzle-kit migrate` rejoué affiche deux NOTICE PostgreSQL (« schema "drizzle" already exists ») : normal.
- Les fichiers du schéma ne peuvent pas importer `server-only` (chargés par `drizzle-kit` hors de Next).
- `result_cache_frames` a pour clé primaire `(cache_id, frame_hash)` : dédoublonner les dHash d'un clip avant l'insertion (U10).
- Distance de Hamming pour le cache : dHash stockés en `bigint`, distance = `bit_count((a # b)::bit(64))` (`#` = XOR, `bit_count` existe depuis PostgreSQL 14). À valider en U10, y compris la conversion des valeurs 64 bits signées entre JavaScript (`BigInt`) et PostgreSQL.

## Supabase Auth et Storage

- Installé en U03 : `@supabase/supabase-js` 2.117.3. CLI 2.120.0 appelée par `npx` (`npm run db:start`, `db:stop`, `db:reset`) et par `supabase/setup-cli` en CI ; pas en dépendance (son script d'installation télécharge un binaire).
- Clés : la CLI et les projets récents fournissent des clés `sb_publishable_…` (publique, ex-anon) et `sb_secret_…` (serveur, ex-service_role) ; on n'utilise que celles-ci.
- Pile locale : `supabase/config.toml` ; migrations et seed de la CLI désactivés (AD-24), Realtime et stockage vectoriel désactivés. Studio : http://127.0.0.1:54323. Les clés locales sont des valeurs de démonstration fixes.
- Supabase accorde par défaut tous les droits sur `public` aux rôles `anon` et `authenticated` : sans RLS, la clé publique lit tout (vérifié). D'où la migration `0002` qui retire ces droits.
- Connexion depuis GitHub Actions : utiliser l'URL du **session pooler** (la connexion directe est en IPv6 uniquement).
- Auth côté serveur avec Next : https://supabase.com/docs/guides/auth/server-side/nextjs
- Google : https://supabase.com/docs/guides/auth/social-login/auth-google
- Storage : https://supabase.com/docs/guides/storage — URL signées : https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
- Pièges :
  - Côté serveur, valider l'utilisateur avec `auth.getClaims()` (signature vérifiée) ou `auth.getUser()` (appel à Supabase), jamais avec `getSession()` (AD-34).
  - Installé en U04 : `@supabase/ssr` 0.12.7. `createServerClient(url, clé publique, { cookieOptions, cookies: { getAll, setAll(cookies, headers) } })` ; dans le proxy, recopier aussi les en-têtes `headers` passés à `setAll` (Cache-Control privé : une réponse portant un jeton ne doit jamais être mise en cache). Options de cookie par défaut `httpOnly: false` : on force `httpOnly: true` (aucun client navigateur). Cookie `sb-<ref>-auth-token` (découpé en `.0`, `.1` si long).
  - Liens d'email : gabarits `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email|recovery` → `/auth/confirm` → `verifyOtp({ token_hash, type })` (usage unique, fonctionne sur un autre appareil, contrairement au code PKCE). Si `redirectTo` n'est pas dans la liste « Redirect URLs », Supabase met l'adresse du site à la place : le lien ne mène alors nulle part.
  - `signUp` avec une adresse déjà inscrite : pas d'erreur, utilisateur factice sans `identities` (ne pas créer de profil).
  - Next 16 : une Server Action re-rend la page courante ; une redirection serveur à ce moment (ex. « déjà connecté ») empêche le code client de s'exécuter. Une redirection interne par `window.location.assign` devient une navigation sans rechargement : recharger soi-même les états client liés à la session.
  - Route handlers : `redirect()` de `next/navigation` joint à la réponse les cookies écrits via `cookies()`.
  - Mailpit (pile locale) : `GET /api/v1/search?query=to:"adresse"` puis `GET /api/v1/message/{ID}` (champ `HTML`). Sans SMTP personnalisé, Supabase en ligne n'écrit qu'aux membres de l'organisation (erreur `email_address_not_authorized`).
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
- Installé en U07 : `src/server/ai/` (`OpenAIVisionProvider`, consigne `identify.v1`, `pricing.ts`, `retry.ts`). Appel : `client.responses.parse({ model, instructions, input: [{ role: "user", content: [input_text, input_image…] }], text: { format: zodTextFormat(schema, "identification") }, store: false, max_output_tokens }, { timeout, maxRetries: 0, signal })`, puis `output_parsed` revalidé par zod. Refus : élément de contenu `type: "refusal"` dans `output`.
- Sorties structurées : tous les champs requis, absences en `nullable()` ; pas de bornes (min/max) dans le schéma envoyé, elles sont appliquées après (`normalizeAnswer`).
- Erreurs passagères (nouvelle tentative) : `APIConnectionError` (dont `APIConnectionTimeoutError`), `RateLimitError`, `InternalServerError`. Détail d'image : `low | high | auto | original` (défaut `auto`).
- Jetons : `usage.input_tokens`, `usage.input_tokens_details.cached_tokens`, `usage.output_tokens` (inclut le raisonnement). La consigne est mise en cache par OpenAI d'un appel à l'autre (jetons en cache facturés 20 fois moins cher).
- Mesures réelles (15 octobre 2026, `gpt-6.1-sol`, détail `auto`, 2 images 768 px) : 2,3 à 2,6 s, 0,0005 à 0,0018 € par appel ; *Le Voyage dans la Lune* (domaine public) reconnu à 100 %. Test en direct : `npm run test:ai`.

## TMDB API v3

- Doc : https://developer.themoviedb.org/docs — référence : https://developer.themoviedb.org/reference/intro/getting-started
- Usage : `search/movie`, `search/tv`, `movie/{id}`, `tv/{id}` avec `append_to_response=credits,videos,similar,recommendations`, `configuration` pour les URL d'images. Toujours `language=fr-FR`, repli sur `en-US` si synopsis vide.
- Où regarder : `movie/{id}/watch/providers` et `tv/{id}/watch/providers` (données fournies par JustWatch, **attribution JustWatch obligatoire**). Licence commerciale TMDB requise (D2).
- Accueil (16 octobre 2026) : `trending/{movie|tv}/week`, `movie/top_rated` (`region=FR`), `genre/movie/list`, en `fr-FR`. Éléments validés un par un (`toShowcaseTitle`), contenus `adult` écartés. Page d'accueil en ISR 6 h via `getStaticPageCatalog()` (sans Redis). Images : affiches `w342`, images larges `w1280` (vedette) et `w780` (genres), servies sans l'optimiseur Vercel.
- Installé en U16 (`src/server/catalog/watch/`) : une requête renvoie tous les pays (`results.{FR,BE,…}` avec `link`, `flatrate`, `free`, `ads`, `rent`, `buy`) ; **un seul lien par pays** (page récapitulative TMDB avec les liens JustWatch par service), pas de lien direct par service. 89 pays couverts pour *Matrix* ; **le Togo n'est pas couvert**. Cache Redis 12 h. Pays du visiteur : en-tête Vercel `x-vercel-ip-country`.
- Mention obligatoire et logo : https://www.themoviedb.org/about/logos-attribution
- Respecter les limites de débit et mettre en cache selon leurs conditions.
- **Conditions (vérifiées le 15 octobre 2026)** : cache de 6 mois au maximum (section 1.C) ; logo TMDB et mention « uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB » (section 3) ; **tout usage payant exige un accord écrit** (section 2.A, D2). Pas de réponse TMDB stockée dans le dépôt (pas de fixtures).
- Installé en U08 : `src/server/catalog/` (`TmdbCatalog`, `createTmdbClient` : délai 5 s, une nouvelle tentative sur 429 / 5xx avec `Retry-After` borné à 2 s, zod sur chaque réponse ; cache Redis 7 jours `tmdb:search|details|configuration`). Authentification par **jeton de lecture** (`Authorization: Bearer`, JWT `eyJ…`).
- **Piège `search/multi`** : la recherche française peut ne pas remonter la bonne fiche quand le titre est anglais (« Attack on Titan » : la série n'apparaît qu'en `en-US`). `matchProposedTitle` interroge toujours `fr-FR` et `en-US` en parallèle et fusionne les titres d'une même fiche. Les résultats mêlent films, séries et personnes : valider chaque élément à part.
- Test en direct : `npm run test:tmdb` (20 titres, clés de `.env.local`, hors CI).

## Watchmode (secours pour « où regarder »)

- Doc : https://api.watchmode.com/docs — utilisé seulement si D3 l'impose.

## Upstash Redis et Ratelimit

- Doc : https://upstash.com/docs/redis/overall/getstarted — Ratelimit : https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- Installé en U08 : `@upstash/redis` 1.39.0, `getRedis()` / `cachedJson()` dans `src/server/cache/redis.ts` (délai 1,5 s par `signal: () => AbortSignal.timeout(…)`, 1 nouvelle tentative, `enableTelemetry: false`, valeurs revalidées par zod à la lecture, panne Redis = pas de cache). Sans `UPSTASH_REDIS_REST_*`, pas de cache (local, CI).
- Installé en U11 : `@upstash/ratelimit` 2.2.0 (`src/server/http/rate-limit.ts` : `slidingWindow(10, "1 m")` et `fixedWindow(60, "1 d")` par IP, `analytics: false`, `timeout`, `await result.pending`). Quota : script Lua via `redis.eval(script, [clé], [args])` (`src/server/quota/quota-store.ts`) ; vérifié en direct (`npm run test:quota`) : 20 réservations simultanées pour une limite de 3 → exactement 3.
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

## PostHog (suivi des erreurs et analytique, AD-28)

- Doc : https://posthog.com/docs/libraries/next-js — erreurs : https://posthog.com/docs/error-tracking/installation/nextjs — options navigateur : https://posthog.com/docs/libraries/js/config — sans cookie : https://posthog.com/docs/privacy/data-collection
- Fichiers : `src/client/observability/posthog.ts` (`loadPostHog` : `import("posthog-js")` différé puis `posthog.init`, seulement si une clé existe ; `reportBoundaryError`), `src/instrumentation-client.ts` (déclenche le chargement), `src/instrumentation.ts` (`onRequestError` → `captureServerError`, runtime Node.js seulement), `src/server/observability/posthog-server.ts`, `src/shared/observability/posthog.ts` (`scrubEvent`, `withEnvironment`, testés), `src/app/error.tsx` et `src/app/global-error.tsx` (`reportBoundaryError` : la capture automatique écoute `window.onerror` et ne voit pas les erreurs attrapées par une page d'erreur).
- Navigateur : `cookieless_mode: "always"` (aucun cookie ni stockage, pas de bandeau) **exige** le réglage projet « Cookieless server hash mode » (Settings → Project → Web analytics), sinon aucun événement n'est enregistré. Avec ce mode : jamais d'`identify` ni d'`alias`, `person_profiles: "never"`. `defaults: "2026-05-30"`, `capture_pageview: "history_change"` (navigations App Router), `autocapture`, enregistrement des sessions et sondages coupés, `capture_exceptions: true`.
- `before_send` accepte un tableau de fonctions (navigateur et Node) ; renvoyer `null` rejette l'événement. Les exceptions sont dans `properties.$exception_list[].value`.
- Serveur (Vercel) : `new PostHog(token, { host, flushAt: 1, flushInterval: 0 })` et `await captureExceptionImmediate(error, distinctId?, properties?)` avant la fin de la requête. Sans `distinctId`, l'événement est anonyme. `disableGeoip` vaut `true` par défaut côté Node.
- Chargement : `instrumentation-client.ts` attend l'événement `load` puis `requestIdleCallback` (délai max 5 s) avant `loadPostHog()`. Chargé dès l'hydratation, posthog-js (≈ 300 Ko non compressés) faisait perdre ≈ 12 points de performance mobile. Le bundle `posthog-js/dist/module.slim` (≈ 150 Ko) existe, mais son option `__extensionClasses` est marquée `@internal` : non utilisée.
- Pas de proxy inverse : le mode sans cookie calcule son identifiant anonyme à partir de l'IP réelle du visiteur. Le navigateur appelle `eu.i.posthog.com` directement (à autoriser dans la CSP en U28).
- Source maps non envoyées (clé personnelle PostHog requise, `@posthog/nextjs-config`) : prévu en U29. Les piles d'erreurs navigateur restent minifiées d'ici là.
- Clé de projet `phc_…` (publique, envoi d'événements seulement) ≠ clé personnelle `phx_…` (accès au compte : jamais dans l'application). `env.ts` refuse une clé qui ne commence pas par `phc_`.

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
- Installé en U10 : `sharp` 0.35.5 (libvips 8.18). dHash : `sharp(buf).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true })`, puis lire un octet sur `info.channels` (un canal alpha peut subsister) et appliquer `dHash` de `src/shared/frames/analysis.ts` (`src/server/identification/frame-hashes.ts`).
- dHash stocké en `bigint` PostgreSQL signé : `BigInt.asIntN(64, h)` ; la distance se calcule en SQL par `bit_count((a # b)::bit(64))` (PostgreSQL 14+).

## Next.js : pages mises en cache (ISR) et appels réseau

- Fiche titre (U15) : `export const revalidate = 86400` + `generateStaticParams()` qui renvoie `[]` : chaque fiche est générée à la première visite, servie depuis le cache (`x-nextjs-cache: HIT`, p95 mesuré 23 ms), revalidée chaque jour (modèle sans Cache Components, `cacheComponents` non activé).
- **Piège (vérifié le 16 octobre 2026)** : le client Upstash appelle `fetch` en `cache: "no-store"`. Dans une page ISR, Next répond alors 500 (« Page changed from static to dynamic at runtime »). Les pages ISR et le sitemap utilisent donc `getStaticPageCatalog()` (catalogue TMDB sans Redis) ; Next met lui-même en cache la page et les réponses TMDB. Ne jamais appeler Redis depuis une page ISR.
- Ne jamais absorber les erreurs internes de Next dans un `catch` (digest `DYNAMIC_SERVER_USAGE` ou `NEXT_…`) : les relancer (voir `sitemap-titles.ts`).
- `permanentRedirect` renvoie 308 ; `PageProps<"/titre/[kind]/[idSlug]">` est généré par `next typegen`.

## Vitest et Playwright

- Installé en U12 : `@playwright/test` 1.64.1, `playwright.config.ts` (projet `mobile-chrome` = Pixel 7 + `channel: "chrome"`, Chrome préinstallé localement et sur les runners Ubuntu, aucun navigateur à télécharger ; `webServer` = `next start` sur le build). Serveur simulé par `page.route` (`/api/identify`, `/api/quota`, `image.tmdb.org`, PostHog bloqué). Vidéo de test : fractale générée (`tests/e2e/fixtures/clip.mp4`). Lancer `npm run build` avant `npm run test:e2e`.

- https://vitest.dev — https://playwright.dev
- Vitest 5.0.3 installé (4 octobre 2026) pour la CI. Exige `@types/node` ^22 ou ≥ 24 (d'où l'alignement sur 24.19.1) et Node ^22.12 ou ^24. Configuration : `vitest.config.mts` (extension `.mts` pour éviter l'avertissement « ESM syntax in a file loaded as CommonJS » de Vite ; alias `@` → `src`, environnement `node`). `--passWithNoTests` retiré en U01.
- `server-only` lève une erreur hors de la condition `react-server` : Vitest l'aliase vers `server-only/empty.js` pour pouvoir tester `src/server/**`.
- Audit en CI limité aux dépendances de production (`npm audit --omit=dev --audit-level=high`) : au 4 octobre 2026, `braces` (dépendance de développement) remonte 5 alertes « high » sans correctif non cassant.
- Playwright : profils mobile (Pixel, iPhone) en plus du desktop.
