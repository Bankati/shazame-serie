# Architecture Context

> Les versions précises et les pièges de chaque librairie sont dans `context/library-docs.md`.
> Les décisions marquées **(proposé)** attendent une validation : voir `progress-tracker.md`.

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript strict, Node.js 24 LTS (AD-01, AD-02 : le CDC cite Next 14 et Node 20, hors support en octobre 2026) | Pages (SSR pour les fiches titres), routes API, une seule base de code |
| UI | Tailwind CSS 4 + shadcn/ui + lucide-react | Composants accessibles, tokens de design en variables CSS |
| Formulaires | react-hook-form + zod | Validation partagée client/serveur |
| Auth | Supabase Auth via `@supabase/ssr` (email + Google) | Sessions par cookies HttpOnly, confirmation d'email, reset |
| Database | PostgreSQL 15+ géré (Supabase) + Drizzle ORM | Données applicatives, migrations versionnées |
| Cache / quotas | Upstash Redis (REST) + `@upstash/ratelimit` | Compteurs de quota et de dépense IA, limitation de débit, raccourci du cache |
| Stockage | Supabase Storage (buckets privés) | Images des signalements consentis, fichiers d'export temporaires |
| IA | OpenAI (modèle de vision) derrière l'interface `VisionProvider` | Identification à partir des images |
| Métadonnées | TMDB API v3 | Fiches, affiches, distribution, similaires, bandes-annonces |
| Où regarder | TMDB `watch/providers` (données JustWatch) **(proposé)**, Watchmode en secours | Disponibilité par pays |
| Paiement | Prestataire derrière l'interface `BillingProvider` **(à décider : Stripe si l'entité est éligible, sinon Paddle ou Lemon Squeezy)** | Abonnements, page de paiement hébergée, factures |
| Emails | Supabase Auth (emails d'authentification via SMTP Resend) + Resend / React Email (autres emails) | Emails transactionnels en français |
| Observabilité | Sentry (erreurs), PostHog ou Plausible (analytique), sonde externe de disponibilité | Alertes et mesures |
| Hébergement | Vercel **plan Pro** (le plan Hobby interdit l'usage commercial) | Déploiement continu, crons |
| CI/CD | GitHub Actions | Lint, typecheck, tests, build, déploiement |
| Tests | Vitest (unitaires), Playwright (bout en bout), harnais `eval/` | Qualité et précision d'identification |

## System Boundaries

```
src/
├── app/                      # Routes Next.js : pages et route handlers. MINCE : pas de logique métier.
│   ├── (public)/             # accueil, résultat, fiche titre, tarifs, pages légales
│   ├── (auth)/               # connexion, inscription, mot de passe oublié, callback OAuth
│   ├── (account)/            # profil, paramètres, historique, liste de suivi, abonnement
│   ├── admin/                # back-office (rôle admin obligatoire)
│   └── api/                  # route handlers : valider (zod) → appeler server/* → répondre
├── components/
│   ├── ui/                   # shadcn/ui généré — PROTÉGÉ, ne pas éditer à la main
│   └── <feature>/            # composants d'une fonctionnalité (identify, title, account, admin…)
├── client/                   # Code navigateur uniquement
│   └── frames/               # extraction d'images, contrôle qualité, dédoublonnage
├── server/                   # Logique métier, 'server-only'. Jamais importé par un composant client.
│   ├── env.ts                # variables d'environnement validées par zod
│   ├── log.ts                # logger structuré (sans données sensibles)
│   ├── http/                 # réponses JSON { ok, data | error }
│   ├── health/               # route de santé, erreur volontaire Sentry
│   ├── observability/        # options Sentry des runtimes serveur
│   ├── db/                   # schéma Drizzle, client, requêtes
│   ├── auth/                 # session, rôles, garde-fous (requireUser, requireAdmin), visiteur
│   ├── identification/       # pipeline, score, empreintes, cache de résultats
│   ├── ai/                   # VisionProvider, adaptateur OpenAI, consignes versionnées, garde de dépense
│   ├── catalog/              # client TMDB, cache des fiches, où regarder, similaires
│   ├── quota/                # vérification, réservation, confirmation, libération
│   ├── billing/              # BillingProvider, webhooks, entitlement Premium
│   ├── account/              # profil, export JSON, suppression
│   ├── email/                # Mailer + gabarits React Email
│   ├── admin/                # statistiques, actions admin
│   └── audit/                # journal d'audit
├── shared/                   # Code pur utilisable côté client ET serveur (aucun effet de bord)
│   ├── frames/               # paramètres d'échantillonnage communs au navigateur et à l'eval
│   └── observability/        # options et filtrage Sentry communs (aucune donnée personnelle)
├── schemas/                  # Schémas zod partagés (entrées API, réponses IA) et codes d'erreur
├── content/fr/               # Textes d'interface centralisés (prépare la V2 multilingue)
├── lib/                      # Utilitaires purs (dates Europe/Paris, slugs, formatage)
├── instrumentation.ts        # init Sentry serveur/edge (charge env.ts : refus de démarrer si une variable manque)
├── instrumentation-client.ts # init Sentry navigateur
└── proxy.ts                  # (ex-middleware, à vérifier selon la version) rafraîchissement de session
eval/                         # Harnais du jeu de test : manifeste des 100 clips + script de mesure
drizzle/                      # Migrations SQL générées — ne jamais éditer une migration appliquée
context/plans/                # Plans validés par /architect, un fichier par unité (U01.md…)
```

## Identification — flux détaillé

```
Navigateur                                   Serveur (POST /api/identify)
──────────                                   ────────────────────────────
1. Valide format / durée / taille
2. Extrait les images (canvas, 768 px max,
   paramètres de src/shared/frames)
3. Écarte noires / floues / quasi identiques
4. < 2 images → stop, message (rien n'est envoyé)
5. Envoie multipart : 2 à 5 JPEG ≤ 1,5 Mo ──▶ 6. Limitation de débit (IP + compte/visiteur)
                                              7. Valide : nombre, tailles, type réel JPEG (sharp)
                                              8. Quota restant > 0 ? sinon 429 QUOTA_EXCEEDED
                                              9. Calcule les dHash CÔTÉ SERVEUR (sharp)
                                             10. Cache (RG6) : hit → réponse, source=cache, AUCUN décompte
                                             11. Garde de dépense (RG5) : réserve le coût max estimé
                                                 → plafond atteint : 503 AI_PAUSED
                                             12. Réserve 1 unité de quota (INCR atomique, revérifie la limite)
                                             13. VisionProvider.identify : délai, 3 tentatives (RG16)
                                             14. Rapprochement TMDB + score combiné (CDC 15.2)
                                             15. Confiance ≥ 50 % → quota.commit() (RG3)
                                                 sinon, ou échec à n'importe quelle étape → quota.release()
                                             16. Ajuste la dépense au coût réel
                                             17. Écrit l'identification ; écrit le cache si confiance ≥ seuil
                                             18. Images gardées en mémoire seulement (RG7)
◀──────────────────────────────────────────  19. Réponse : résultat, alternatives, quota restant, resetAt
```

Choix assumés de ce flux **(proposé, AD-12 et AD-13)** :

- Les empreintes sont calculées **par le serveur** à partir des images reçues. Une empreinte fournie par le client pourrait empoisonner le cache (images du film A envoyées avec l'empreinte d'un clip viral B). Le navigateur calcule ses propres hash uniquement pour écarter les doublons avant l'envoi.
- Un utilisateur dont le quota est épuisé reçoit `QUOTA_EXCEEDED` même si le clip est en cache : le paywall reste prévisible. Le cache continue de répondre quand l'IA est en pause (RG5).
- Les étapes 12 à 17 garantissent qu'une réservation est toujours confirmée ou libérée (`try / finally`).

Signalement : les images ne sont jamais écrites sur disque ou en stockage pendant l'identification. Si l'utilisateur signale une erreur **et** consent, le navigateur (qui a encore les images en mémoire) les renvoie avec le signalement vers un bucket privé. Après rechargement de la page, le signalement reste possible mais sans images.

## Cache de résultats

- `result_cache` : une entrée par résultat retenu ; `result_cache_frames` : les dHash 64 bits (`bigint`) de chaque image de l'entrée.
- Correspondance exacte : empreinte = SHA-256 des dHash triés → clé Redis `cache:fp:{empreinte}`.
- Correspondance proche : une entrée est retenue si au moins `CACHE_MIN_MATCHING_FRAMES` (2) images ont une distance de Hamming ≤ `CACHE_MAX_HAMMING` (valeur à calibrer, départ 6) avec ses images. Requête SQL `bit_count((a # b)::bit(64))`. Volume V1 faible : un balayage indexé suffit ; à revoir au-delà de ~100 000 entrées.
- Écriture seulement si la confiance finale ≥ `CACHE_MIN_CONFIDENCE` (départ 80 %) ou après validation admin.
- Un signalement sur un résultat servi par le cache désactive l'entrée (`disabled = true`) jusqu'à revue admin. L'admin peut la corriger (`validated = true`, nouveau `tmdb_id`).

## Storage Model

- **PostgreSQL (Supabase)** — tables :
  - `profiles` (id = auth.users.id, display_name, avatar_path (chemin dans le bucket privé `avatars`), role `user|admin`, status `active|suspended`, deleted_at, created_at)
  - `identifications` (id, user_id nullable, visitor_key nullable (l'un des deux obligatoire), fingerprint, tmdb_id nullable, media_type, confidence, alternatives jsonb, counted bool, source `ai|cache`, outcome `shown|low_confidence|failed`, prompt_version, provider, model, cost_micro_eur, latency_ms, created_at)
  - `result_cache` (id, fingerprint unique, tmdb_id, media_type, confidence, alternatives jsonb, validated bool, disabled bool, hits, created_at) et `result_cache_frames` (cache_id, frame_hash bigint)
  - `watchlist_items` (user_id, tmdb_id, media_type, added_at) — unique (user_id, tmdb_id, media_type)
  - `reports` (id, identification_id, user_id nullable, proposed_tmdb_id + proposed_media_type, corrected_tmdb_id + corrected_media_type (un identifiant TMDB n'est unique que par type), images_consent bool, storage_paths text[], status `open|reviewed|added_to_eval|rejected`, created_at)
  - `subscriptions` (user_id unique, provider, provider_customer_id, provider_subscription_id, plan `monthly|yearly`, status normalisé `active|past_due|canceled|expired`, current_period_end, cancel_at_period_end, updated_at)
  - `billing_events` (provider_event_id unique, type, processed_at) — idempotence des webhooks
  - `ai_spend_daily` (day date Paris, total_micro_eur, calls) — miroir durable du compteur Redis, pour le tableau de bord
  - `app_settings` (clé/valeur typée : ai_daily_cap_micro_eur, premium_daily_cap, visitor_daily_quota, free_daily_quota)
  - `admin_audit_log` (id, admin_id, action, target_type, target_id, before jsonb, after jsonb, created_at)
  - `consents` (user_id, kind `terms|privacy|b2b`, version, granted bool, created_at) — le consentement aux images est porté par chaque `reports.images_consent`
  - `data_exports` (id, user_id, storage_path, expires_at, created_at)
- **Redis (Upstash)** : `quota:{user|visitor}:{id}:{YYYY-MM-DD Paris}` (expire après minuit Paris), `ai:spend:{YYYY-MM-DD Paris}`, `rl:*` (limitation de débit), `tmdb:*` (réponses TMDB, durée selon leurs conditions), `cache:fp:{empreinte}`.
- **Supabase Storage**, buckets privés : `reports` (images consenties, chemins aléatoires, lecture admin par URL signée), `avatars` (photos de profil), `exports` (JSON d'export, URL signée valable 24 h, supprimé par cron).
- **Aucune vidéo, nulle part.** Montants en entiers : centimes pour les prix, micro-euros pour les coûts (le fournisseur IA facture en USD : conversion par une constante `USD_TO_EUR` révisée chaque mois). Dates en UTC ; le « jour » de quota et de dépense se calcule en `Europe/Paris`.

## Auth and Access Model

- Supabase Auth : email + mot de passe (8 caractères min., confirmation par lien) et Google OAuth. Cookies HttpOnly, Secure, SameSite=Lax.
- Connexion, inscription et reset passent par des **Server Actions** (pas d'appel direct du navigateur à Supabase) pour appliquer notre limitation de débit (20 tentatives par heure et par IP sur la connexion, CDC 18.1).
- RG9 (30 jours d'inactivité) et RG10 (lien valable 24 h) se règlent dans la configuration Supabase Auth. **À vérifier** : le délai d'inactivité de session dépend du plan Supabase (voir `library-docs.md`).
- Un compte dont l'email n'est pas confirmé est traité comme un visiteur pour le quota (proposé, Q14).
- Visiteurs : cookie signé `visitor_id` (HttpOnly, 1 an) + adresse IP pour la limitation de débit. Sert uniquement au quota RG2.
- Rôles : `user`, `admin` dans `profiles.role`, **toujours relu en base côté serveur**. Pas d'interface de promotion en V1 : un admin est désigné par migration de seed ou SQL manuel.
- Propriété : chaque ressource utilisateur porte `user_id` ; toute requête filtre par l'utilisateur de la session vérifiée (`auth.getUser()`).
- L'application accède à la base **uniquement côté serveur** via Drizzle. RLS activée sur toutes les tables, sans politique pour `anon` et `authenticated`, **et** aucun droit accordé à ces rôles sur le schéma `public`, y compris pour les tables futures (migration `0002`, AD-24) : la clé publique Supabase n'ouvre aucune table (testé par `npm run test:db`).
- Schéma : `src/server/db/schema/` ; migrations : `drizzle/` (générées par `drizzle-kit`, plus des migrations SQL personnalisées pour les buckets, les réglages initiaux et les droits). Pile locale : Supabase CLI (`npm run db:start`), configurée dans `supabase/config.toml`.
- Premium (`server/billing/getEntitlement()`) = `status = 'active'`, ou `status in ('past_due','canceled')` et `current_period_end > now()`. Jamais stocké en double, jamais lu depuis le client.
- Compte suspendu : ne peut ni identifier ni modifier ses données ; peut exporter et supprimer.
- Compte supprimé (AD-26, 8 octobre 2026) : abonnement annulé, fichiers de l'utilisateur supprimés des buckets `avatars` et `exports` (la cascade SQL ne touche pas Storage), email de confirmation envoyé à l'adresse lue avant suppression, puis utilisateur Auth supprimé ; la cascade `auth.users` → `profiles` → données efface tout immédiatement, ce qui respecte « effacé sous 30 jours » (CDC 18.1). Les signalements restent, anonymisés (`user_id` à null). Seules les factures restent chez le prestataire de paiement (obligation légale).

## External Services and Abstractions

| Interface | Implémentation V1 | Pourquoi l'abstraction |
| --- | --- | --- |
| `VisionProvider.identify(frames, ctx) → Result<VisionResult>` | `OpenAIVisionProvider` | Changer de fournisseur (Gemini, Claude, DeepCine en V2) sans toucher au pipeline |
| `CatalogProvider` | `TmdbCatalog` | Plan B si la licence TMDB n'est pas obtenue |
| `WatchProvider` | `TmdbWatchProviders` | Basculer vers Watchmode si nécessaire |
| `BillingProvider` (createCheckout, createPortalSession, verifyAndParseWebhook) | Selon D1 | Les statuts propres au prestataire sont convertis en statut normalisé à la frontière |
| `Mailer` | `ResendMailer` | Changer de fournisseur d'emails |

Chaque appel externe : délai maximal, journalisation sans donnée personnelle, comportement de secours défini.

## Environnements et secrets

- `development` (local, Supabase dans Docker), `preview` (préproduction), `production`. **Un seul projet Supabase en ligne** (`shazam_serie`) sert à la préproduction et à la production (AD-27) : la préproduction travaille sur les données réelles, et seules les migrations fusionnées dans `main` y sont appliquées. Plan payant avant le lancement (le plan gratuit met les projets en pause après une période d'inactivité).
- Variables serveur : `DATABASE_URL`, `SUPABASE_SECRET_KEY` (clé « secret » des nouvelles clés Supabase, remplace `service_role`), `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `TMDB_API_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BILLING_*`, `RESEND_API_KEY`, `SENTRY_DSN`, `CRON_SECRET`, `VISITOR_COOKIE_SECRET`, `ADMIN_ALERT_EMAIL`.
- Variables publiques (`NEXT_PUBLIC_*`) : URL du site, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (clé « publishable », ex-« anon »), clé analytique, DSN Sentry navigateur. Rien d'autre.
- `src/server/env.ts` valide les variables au démarrage : l'application refuse de démarrer si l'une manque. Les variables sont ajoutées au fil des unités ; celles des services externes sont obligatoires quand `VERCEL_ENV` vaut `preview` ou `production`, facultatives en local et en CI. Liste à jour : `.env.example`.
- Santé : `GET /api/health` (sonde et test de fumée), `GET /api/health/sentry-check` (erreur volontaire, `Authorization: Bearer <CRON_SECRET>`). Réglages Vercel/Sentry/GitHub : `docs/setup-deploiement.md`.

## Tâches planifiées (Vercel Cron → `/api/cron/*`, protégées par `CRON_SECRET`)

- Toutes les heures : suppression des exports expirés (> 24 h).
- Chaque jour : purge de l'historique > 2 ans (RG11) ; rappel de renouvellement J-3 (RG13) si le prestataire ne l'envoie pas ; suppression des images de signalement selon la durée de conservation retenue (Q16) ; consolidation `ai_spend_daily`.

## Invariants

1. Le serveur ne reçoit jamais de vidéo : 2 à 5 images JPEG, 1,5 Mo au total, type réel vérifié.
2. Aucun module hors `src/server/ai/` n'importe le SDK OpenAI ; tout appel IA passe par la garde de dépense (RG5) et enregistre son coût.
3. Une identification n'est décomptée que par `quota.commit()` après un résultat ≥ 50 % issu d'un appel IA ; toute réservation est confirmée ou libérée ; le cache et les échecs ne décomptent rien (RG3, RG6, RG16).
4. Les empreintes du cache sont calculées par le serveur ; une donnée de cache n'est jamais écrite à partir d'une valeur fournie par le client.
5. Le statut Premium ne change que par un webhook à signature vérifiée et identifiant d'événement non encore traité, ou par une action admin journalisée.
6. Toute mutation admin écrit dans `admin_audit_log` dans la même transaction.
7. Toute route API ou Server Action valide son entrée avec zod avant toute logique, et vérifie session, rôle et propriété avant toute lecture ou mutation de données utilisateur.
8. `src/app/**` ne contient ni logique métier ni accès direct à la base : il appelle `src/server/**`.
9. Aucune image, mot de passe, jeton, email complet ou donnée de carte dans les journaux, Sentry ou l'analytique.
10. Aucune donnée n'est utilisée à des fins B2B sans consentement `b2b` actif (RG17).
11. Aucun travail long après la réponse dans un route handler : les traitements différés passent par les crons.
12. La mention TMDB (et celle de la source des données de streaming) est visible sur chaque fiche et dans les pages légales.
13. Une migration appliquée n'est jamais modifiée ; toute évolution de schéma passe par une nouvelle migration.
