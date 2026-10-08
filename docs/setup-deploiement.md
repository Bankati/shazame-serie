# Mise en place du déploiement (U01)

Réglages à faire une seule fois par le fondateur. Le code est prêt : ces étapes branchent Vercel, Sentry et GitHub.
Aucune valeur secrète ne doit être copiée dans le dépôt, dans un ticket ou dans une conversation.

## 0. Poste de développement

- Installer **Node.js 24 LTS** (le projet refuse les autres versions majeures : `.nvmrc`, `engines`).
- `npm ci`, puis copier `.env.example` en `.env.local` si vous voulez tester Sentry en local (facultatif).

## 1. Sentry

1. Créer une organisation, puis un projet de plateforme **Next.js**.
2. Noter le **DSN** du projet (Settings → Client Keys). Il sert à la fois pour `SENTRY_DSN` et `NEXT_PUBLIC_SENTRY_DSN`.
3. Noter le **slug de l'organisation** et le **slug du projet** (`SENTRY_ORG`, `SENTRY_PROJECT`).
4. Créer un **Organization Auth Token** (Settings → Auth Tokens) : `SENTRY_AUTH_TOKEN`. Il sert uniquement au build, pour envoyer les source maps.
5. Dans les réglages du projet Sentry, laisser activé le filtrage des données sensibles côté serveur (Security & Privacy → Data Scrubber). Le code filtre déjà avant l'envoi : c'est une seconde barrière.

## 2. Vercel

1. **Add New → Project**, importer le dépôt `Bankati/shazame-serie`. Framework : Next.js (détecté).
2. Settings → General → **Node.js Version : 24.x**.
3. Settings → Environments → Production : **branche de production = `main`**.
4. Settings → Domains : ajouter un domaine pour la préproduction (ex. `shazame-serie-staging.vercel.app`) et l'**affecter à la branche Git `staging`**. C'est l'URL stable de la préproduction.
5. Settings → Environment Variables, pour **Production** et pour **Preview** (valeurs différentes par environnement pour `CRON_SECRET`) :

   | Variable | Valeur |
   | --- | --- |
   | `SENTRY_DSN` | DSN Sentry |
   | `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry (le même) |
   | `CRON_SECRET` | Chaîne aléatoire d'au moins 32 caractères (ex. `openssl rand -base64 48`) |
   | `SENTRY_AUTH_TOKEN` | Jeton Sentry de l'étape 1.4 |
   | `SENTRY_ORG` / `SENTRY_PROJECT` | Slugs Sentry |

   Si `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` ou `CRON_SECRET` manque, le serveur refuse de démarrer (`src/server/env.ts`) : c'est voulu.
6. Laisser coché **Automatically expose System Environment Variables** (fournit `VERCEL_ENV` et `NEXT_PUBLIC_VERCEL_ENV`, utilisés pour nommer l'environnement dans Sentry).
7. Settings → Deployment Protection → **Protection Bypass for Automation** : générer un secret. Il permet au test de fumée GitHub d'appeler les déploiements protégés.
8. Plan : Hobby suffit jusqu'à l'approche du lancement ; passer en **Pro** avant d'ouvrir le service au public (AD-19, le plan Hobby interdit l'usage commercial).

## 3. Supabase (U03)

Un seul projet Supabase en ligne (`shazam_serie`) sert à la préproduction et à la production (AD-27). Le développement utilise la base locale Docker (`npm run db:start`), jamais ce projet.

1. Bouton **Connect** (en haut du projet) → **Connection String** → URI. Remplacer `[YOUR-PASSWORD]` par le mot de passe de la base.
   - **Session pooler** (port 5432) : pour GitHub (migrations).
   - **Transaction pooler** (port 6543) : pour Vercel (application).
   - Pas la connexion directe (IPv6 uniquement, inaccessible depuis GitHub Actions).
2. **Project URL** : `https://<identifiant>.supabase.co`, **sans** `/rest/v1/` (la page Data API affiche l'adresse de l'API REST ; la librairie Supabase ajoute ce suffixe elle-même).
3. **Project Settings → API Keys** : clé **publishable** (`sb_publishable_…`) et clé **secrète** (`sb_secret_…`). Pas les anciennes clés `anon` / `service_role`.
4. Vercel → Settings → Environment Variables, **mêmes valeurs pour Production et Preview** :

   | Variable | Valeur |
   | --- | --- |
   | `DATABASE_URL` | URL du Transaction pooler (6543) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, sans `/rest/v1/` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable |
   | `SUPABASE_SECRET_KEY` | Clé secrète (contourne la RLS : jamais en `NEXT_PUBLIC_*`) |

5. Les migrations sont appliquées par le workflow `Database migrations`, uniquement depuis `main` et après votre approbation (voir section 4). La première fois, le lancer à la main : Actions → Database migrations → Run workflow → branche `main`.
6. Ne jamais lancer `npm run db:seed`, `npm run test:db` ni `db:reset` avec ces valeurs : ils créent et suppriment des comptes. Le seed refuse d'ailleurs toute base non locale.

## 4. GitHub

1. Settings → Secrets and variables → Actions → **New repository secret** : `VERCEL_AUTOMATION_BYPASS_SECRET` = secret de l'étape 2.7.
   Le test de fumée n'envoie ce secret qu'aux domaines `*.vercel.app`. Si vous ajoutez un domaine personnalisé, le déclarer dans l'onglet **Variables** : `ALLOWED_DEPLOYMENT_HOSTS` = domaines séparés par des espaces (ex. `staging.exemple.fr www.exemple.fr`).
2. Settings → Environments → créer l'environnement **`production`** :
   - secret `DATABASE_URL` = URL du **Session pooler** (5432) du projet Supabase ;
   - cocher **Required reviewers** (vous-même) : chaque migration attendra votre approbation ;
   - **Deployment branches and tags** → *Selected branches and tags* → uniquement `main`. Ainsi, aucun lancement depuis `dev` ou `staging` ne peut obtenir ce secret (le workflow le refuse aussi de son côté).
   - Approuver la migration dès la fusion vers `main` : Vercel déploie le code sans l'attendre, d'où la règle des migrations rétrocompatibles (AD-25). Une migration doit arriver sur `main` avant que le code qui s'en sert soit testé sur `staging`, puisque la préproduction utilise la même base (AD-27).
3. Settings → Rules → Rulesets, pour `staging` et `main` : PR obligatoire, et checks obligatoires :
   - `Lint, typecheck, test, build`
   - `Audit des dépendances de production`
   - `Aucun fichier de secrets versionné`
   - `Base de données (migrations, RLS)`
   - `Vérifier la branche source`
   - `Santé du déploiement` (test de fumée sur le déploiement Vercel du dernier commit de la PR)

## 5. Vérifier (critère de fin de U01)

1. Ouvrir la PR `dev` → `staging` : tous les checks ci-dessus passent au vert.
2. Après fusion, la préproduction répond :

   ```bash
   curl https://<domaine-staging>/api/health
   # {"ok":true,"data":{"status":"ok"}}
   ```

3. Déclencher l'erreur volontaire (remplacer `<CRON_SECRET>` par la valeur Preview, sans l'enregistrer dans l'historique partagé) :

   ```bash
   curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<domaine-staging>/api/health/sentry-check
   # HTTP 500 attendu
   ```

   Dans Sentry, une erreur `SentryCheckError` apparaît en moins d'une minute, environnement `preview`, avec une stack qui pointe vers `src/app/api/health/sentry-check/route.ts` (source maps), **sans** cookie, en-tête ni utilisateur.
4. Sans secret, la même URL renvoie `401` : c'est normal.
5. Refaire les étapes 2 et 3 sur la production après la PR `staging` → `main` (environnement `production` dans Sentry).
