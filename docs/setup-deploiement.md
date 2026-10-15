# Mise en place du déploiement (U01)

Réglages à faire une seule fois par le fondateur. Le code est prêt : ces étapes branchent Vercel, PostHog, Supabase et GitHub.
Aucune valeur secrète ne doit être copiée dans le dépôt, dans un ticket ou dans une conversation.

## 0. Poste de développement

- Installer **Node.js 24 LTS** (le projet refuse les autres versions majeures : `.nvmrc`, `engines`).
- `npm ci`, puis copier `.env.example` en `.env.local` si vous voulez tester PostHog en local (facultatif).

## 1. PostHog (suivi des erreurs et analytique, AD-28)

1. Créer le compte depuis **https://eu.posthog.com/signup** (région UE). Vérifier que l'adresse du navigateur commence par `eu.posthog.com` : la région ne se change pas après coup.
2. Settings (roue dentée en bas à gauche) → **Project → General** → **Project token** : la valeur `phc_…` est `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. Ne jamais utiliser une **Personal API key** (`phx_…`) : elle donne accès à tout le compte (le serveur la refuse).
3. Settings → Project → **Web analytics** → activer **« Cookieless server hash mode »**. Sans ce réglage, le site (configuré sans cookie) n'enregistre rien.
4. Settings → Project → **Error tracking** : vérifier que le suivi des erreurs est activé.
5. `NEXT_PUBLIC_POSTHOG_HOST` : rien à saisir (`https://eu.i.posthog.com` par défaut).

## 2. Vercel

1. **Add New → Project**, importer le dépôt `Bankati/shazame-serie`. Framework : Next.js (détecté).
2. Settings → General → **Node.js Version : 24.x**.
3. Settings → Environments → Production : **branche de production = `main`**.
4. Settings → Domains : ajouter un domaine pour la préproduction (ex. `shazame-serie-staging.vercel.app`) et l'**affecter à la branche Git `staging`**. C'est l'URL stable de la préproduction.
5. Settings → Environment Variables, pour **Production** et pour **Preview** (valeurs différentes par environnement pour `CRON_SECRET`) :

   | Variable | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Clé de projet PostHog `phc_…` (étape 1.2) |
   | `CRON_SECRET` | Chaîne aléatoire d'au moins 32 caractères (ex. `openssl rand -base64 48`) |

   En **production**, si l'une manque, le build refuse de se terminer (`src/server/env.ts`) : c'est voulu. En **preview** elles sont facultatives : sans elles, l'aperçu se construit mais ne remonte ni erreurs ni pages vues, et `/api/health/error-check` reste fermée.
6. Laisser coché **Automatically expose System Environment Variables** (fournit `VERCEL_ENV` et `NEXT_PUBLIC_VERCEL_ENV`, utilisés pour marquer l'environnement de chaque événement PostHog).
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
   | `DATABASE_URL` | URL du Transaction pooler (6543) — **obligatoire en Production** depuis U10 : sans elle, le build de production est refusé |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL, sans `/rest/v1/` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable |
   | `SUPABASE_SECRET_KEY` | Clé secrète (contourne la RLS : jamais en `NEXT_PUBLIC_*`) |
   | `TMDB_API_TOKEN` | TMDB → Paramètres → API → « API Read Access Token » (long jeton `eyJ…`) — obligatoire en Production (U08) |
   | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | console.upstash.com → base Redis (région eu-west-1) → REST API — obligatoires en Production (U08) |

5. Région des fonctions : fixée à **Dublin (`dub1`)** par `vercel.json`, à côté de la base (`eu-west-1`). Rien à régler dans Vercel ; ne pas la changer dans Settings → Functions (le fichier l'emporte).
6. Les migrations sont appliquées par le workflow `Database migrations`, uniquement depuis `main` et après votre approbation (voir section 4). La première fois, le lancer à la main : Actions → Database migrations → Run workflow → branche `main`.
7. Ne jamais lancer `npm run db:seed`, `npm run test:db` ni `db:reset` avec ces valeurs : ils créent et suppriment des comptes. Le seed refuse d'ailleurs toute base non locale.

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
   curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<domaine-staging>/api/health/error-check
   # HTTP 500 attendu
   ```

   Dans PostHog → **Error tracking**, une erreur `ErrorCheckError` apparaît en moins d'une minute, avec la propriété `environment` = `preview` et `path` = `/api/health/error-check`, **sans** personne identifiée.
   Ouvrir aussi la préproduction dans un navigateur : une page vue apparaît dans **Web analytics**, et aucun cookie `ph_*` n'est déposé (outils de développement → Application → Cookies).
4. Sans secret, la même URL renvoie `401` : c'est normal.
5. Refaire les étapes 2 et 3 sur la production après la PR `staging` → `main` (propriété `environment` = `production` dans PostHog).
