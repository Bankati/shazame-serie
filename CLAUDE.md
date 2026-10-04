# Plateforme cinéphile — instructions pour l'agent

Application web qui identifie un film ou une série à partir d'un court clip vidéo, affiche sa fiche complète et les services où le regarder, et permet de le garder dans une liste de suivi. Gratuit (15 identifications par jour) + Premium (2,99 EUR/mois). Lancement du MVP : **31 décembre 2026**.

## Lire avant toute tâche, dans cet ordre

1. `context/project-overview.md` — ce qu'on construit, pour qui, règles de gestion RG1 à RG17
2. `context/architecture.md` — stack, frontières, modèle de données, **invariants**
3. `context/code-standards.md` — règles de code
4. `context/ai-workflow-rules.md` — comment travailler (une unité à la fois)
5. `context/progress-tracker.md` — état actuel, décisions, questions ouvertes
6. `context/build-plan.md` — l'unité en cours et son critère de fin
7. `context/plans/<ID>.md` — le plan validé de l'unité en cours (créé par `/architect`)

Selon la tâche :

- Toute interface → `context/ui-context.md` puis `context/ui-registry.md`
- Toute librairie externe → `context/library-docs.md` (versions et pièges) **avant** d'écrire le code
- Doute fonctionnel → `docs/cahier-des-charges-v4.md` (source de vérité fonctionnelle)

## Hiérarchie des sources

1. Décisions consignées dans `context/progress-tracker.md` (section Architecture Decisions)
2. `context/architecture.md` et `context/code-standards.md`
3. `docs/cahier-des-charges-v4.md`

En cas de contradiction : ne pas trancher seul. Ajouter une question ouverte dans `progress-tracker.md` et demander.

## Skills disponibles (`.claude/skills/`)

Invocation par `/nom` (ex. `/audit`). Si la commande n'est pas reconnue par votre version de Claude Code, demander simplement « utilise le skill audit ».

| Commande | Quand l'utiliser |
| --- | --- |
| `/architect` | Avant de commencer une unité du build plan |
| `/review` | Sur le diff, avant chaque commit important et avant d'ouvrir la PR |
| `/audit` | Après chaque unité, avant de passer à la suivante |
| `/imprint` | Après chaque composant UI créé ou modifié |
| `/recover` | Quand quelque chose casse ou que la session dérive |
| `/remember save` / `/remember restore` | Fin et début de chaque session |

## Règles non négociables

- Le serveur ne reçoit **jamais** la vidéo, seulement 2 à 5 images extraites dans le navigateur (le navigateur en extrait 3 à 5 et en écarte les inexploitables).
- Tout appel IA passe par la couche `server/ai` (abstraction + plafond de dépense). Jamais d'import direct du SDK OpenAI ailleurs.
- Les empreintes du cache sont calculées par le serveur, jamais reprises du client.
- Une identification n'est décomptée que si un résultat ≥ 50 % de confiance est affiché, hors cache et hors échec (RG3, RG6, RG16).
- Le statut Premium ne change que via un webhook vérifié du prestataire de paiement ou une action admin journalisée.
- Aucune donnée de carte, aucun secret, aucune image dans les journaux ni dans le dépôt.
- Ne jamais inventer un comportement absent des fichiers de contexte.
- Ne jamais utiliser une API de librairie de mémoire : vérifier dans `context/library-docs.md` et la doc de la version installée.

## Commandes du projet

```bash
npm run dev         # serveur local
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run test:e2e    # Playwright
npm run eval        # jeu de test d'identification (100 clips)
npm run build       # doit passer avant de clore une unité
npm run db:generate # générer une migration Drizzle
npm run db:migrate  # appliquer les migrations
```

## Règles Next.js de la version installée

@AGENTS.md
