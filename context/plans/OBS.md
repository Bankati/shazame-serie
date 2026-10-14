## Plan d'implémentation — OBS Remplacer Sentry par PostHog

Validé par le fondateur le 8 octobre 2026. Unité hors build plan (modifie U01 et U29).

### Ce que nous construisons

Retrait complet de Sentry (paquets, configuration, variables, documentation). PostHog, région UE, mode sans cookies, le remplace pour le suivi des erreurs (serveur via `onRequestError` + `posthog-node`, navigateur via `posthog-js` dans `instrumentation-client.ts` et `global-error.tsx`) et pour l'analytique (pages vues ; événements métier en U29). Un filtre testé retire les données sensibles avant l'envoi. La route `/api/health/sentry-check` devient `/api/health/error-check`.

### Vocabulaire validé

- **Suivi des erreurs** : exceptions serveur et navigateur dans PostHog Error Tracking, marquées preview / production.
- **Analytique** : pages vues maintenant ; événements métier en U29.
- **Utilisateur PostHog** : toujours anonyme ; jamais d'`identify`, `person_profiles: 'never'`.
- **Région UE** : projet hébergé sur `eu.posthog.com`.

### Décisions prises

1. Mode sans cookies (`cookieless_mode: 'always'`, réglage projet « Cookieless server hash mode ») : pas de cookie ni de stockage, pas de bandeau. La rétention se mesure par notre base. Ferme Q12 (PostHog).
2. `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` et `CRON_SECRET` obligatoires en production, facultatifs en preview et en local. `NEXT_PUBLIC_POSTHOG_HOST` vaut `https://eu.i.posthog.com` par défaut.
3. Collecte minimale : `autocapture` coupé, enregistrement des sessions et sondages coupés, pages vues activées, filtre `before_send` testé (emails masqués, paramètres et fragment d'URL retirés).
4. Pas de proxy inverse en V1 : le mode sans cookies calcule son identifiant anonyme à partir de l'IP réelle. Appel direct à `eu.i.posthog.com` (à autoriser dans la CSP en U28).
5. Pas d'envoi des source maps (clé personnelle requise) : reporté à U29.
6. Serveur : envoi immédiat attendu avant la fin de la requête, identifiant anonyme fixe, aucune lecture de cookie.

### Hypothèses

- Les noms exacts de l'API `posthog-node` pour les exceptions sont vérifiés dans les types installés.
- Le runtime edge n'est pas utilisé ; les erreurs edge ne sont pas captées côté serveur.

### Fichiers créés / modifiés

- Supprimés : `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/server/observability/sentry-options.ts`, `src/shared/observability/sentry.ts` (+ test), `src/server/health/sentry-check.ts` (+ test), `src/app/api/health/sentry-check/`, paquet `@sentry/nextjs`.
- Créés : `src/shared/observability/posthog.ts` (+ test), `src/server/observability/posthog-server.ts`, `src/server/health/error-check.ts` (+ test), `src/app/api/health/error-check/route.ts` (+ test).
- Modifiés : `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`, `src/app/error.tsx`, `next.config.ts`, `src/server/env.ts` (+ test), `.env.example`, `package.json`, documentation et fichiers de contexte, skills `audit` et `review`.

### Comment le construire

1. Installer `posthog-js` et `posthog-node` (versions exactes), retirer `@sentry/nextjs`, lire les types installés.
2. Filtre et options partagées, avec tests.
3. Client serveur, `onRequestError`, navigateur, `global-error`.
4. `env.ts` (production obligatoire, preview facultatif), avec tests.
5. Route de vérification et tests.
6. Documentation et contexte.
7. lint, typecheck, test, check:design, build ; `/review`, `/audit` ; commit et push sur `dev`.

### Vérification

- Tests : filtre (email masqué, URL nettoyée) ; `env.ts` (preview sans clé accepté, production sans clé refusé avec le nom de la variable).
- `npm run build` passe sans aucune variable.
- Manuel, après configuration : `/api/health/error-check` avec `CRON_SECRET` → erreur visible dans PostHog Error tracking ; une page vue dans Web analytics, aucun cookie `ph_*`.

### Invariants concernés

- 9 : ni identité, ni email, ni paramètre d'URL, ni corps de requête envoyé ; filtre testé.
- 8 : logique dans `src/server/**` et `src/shared/**`.
- 11 : envoi serveur attendu avant la fin de la requête.
