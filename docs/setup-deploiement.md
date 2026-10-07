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

## 3. GitHub

1. Settings → Secrets and variables → Actions → **New repository secret** : `VERCEL_AUTOMATION_BYPASS_SECRET` = secret de l'étape 2.7.
   Le test de fumée n'envoie ce secret qu'aux domaines `*.vercel.app`. Si vous ajoutez un domaine personnalisé, le déclarer dans l'onglet **Variables** : `ALLOWED_DEPLOYMENT_HOSTS` = domaines séparés par des espaces (ex. `staging.exemple.fr www.exemple.fr`).
2. Settings → Rules → Rulesets, pour `staging` et `main` : PR obligatoire, et checks obligatoires :
   - `Lint, typecheck, test, build`
   - `Audit des dépendances de production`
   - `Aucun fichier de secrets versionné`
   - `Vérifier la branche source`
   - `Santé du déploiement` (test de fumée sur le déploiement Vercel du dernier commit de la PR)

## 4. Vérifier (critère de fin de U01)

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
