# AI Workflow Rules

## Approach

Le projet se construit par incréments, selon un flux piloté par les spécifications. Les fichiers de contexte définissent quoi construire (`project-overview.md`, `docs/cahier-des-charges-v4.md`), comment le construire (`architecture.md`, `code-standards.md`, `ui-context.md`, `library-docs.md`) et où on en est (`progress-tracker.md`, `build-plan.md`). On implémente toujours contre ces fichiers : aucun comportement n'est inventé.

## Le cycle d'une unité

```
/remember restore      (début de session)
      ↓
/architect             → plan validé explicitement, enregistré dans context/plans/<ID>.md
      ↓
implémentation         → une unité du build plan, rien d'autre
      ↓
/imprint               → après chaque composant UI
      ↓
/review                → relecture ligne à ligne du diff ; corrections validées
      ↓
/audit                 → conformité de l'unité ; le développeur décide des corrections
      ↓
progress-tracker.md    → mis à jour
      ↓
/remember save         (fin de session)

En cas de problème à n'importe quelle étape : /recover
```

## Scoping Rules

- Une seule unité du build plan à la fois.
- Préférer de petits incréments vérifiables aux grands changements spéculatifs.
- Ne pas combiner des frontières système sans rapport dans une même étape.
- Ne pas « profiter » d'une unité pour améliorer autre chose : noter l'idée dans `progress-tracker.md`.

## When to Split Work

Découper une étape si elle combine :

- Interface et logique serveur d'un domaine différent (ex. page de tarifs + webhook de paiement).
- Plusieurs routes API sans rapport.
- Un changement de schéma de base et une fonctionnalité qui n'en dépend pas.
- Un changement de consigne IA et un changement de pipeline (on ne saurait plus ce qui a fait varier la précision).
- Un comportement non clairement défini dans les fichiers de contexte.

Si un changement ne peut pas être vérifié de bout en bout rapidement, le périmètre est trop large : le découper.

## Handling Missing Requirements

- Ne pas inventer de comportement produit absent des fichiers de contexte.
- Exigence ambiguë → la clarifier dans le fichier de contexte concerné avant d'implémenter.
- Exigence manquante → l'ajouter comme question ouverte dans `progress-tracker.md`, puis s'arrêter et demander.
- Contradiction entre le CDC et un fichier de contexte → les décisions de `progress-tracker.md` priment ; sinon demander.

## Protected Files

Ne pas modifier sans instruction explicite :

- `src/components/ui/*` — composants générés par shadcn/ui.
- `drizzle/*` — migrations déjà appliquées (créer une nouvelle migration à la place).
- `src/server/ai/prompts/*` — toute nouvelle consigne est une nouvelle version, suivie d'un `npm run eval`.
- `.env*`, secrets, configuration Vercel et Supabase de production.
- `docs/cahier-des-charges-v4.md` — document de référence du fondateur.
- Les internes de toute librairie tierce.

## Keeping Docs in Sync

Mettre à jour le fichier de contexte concerné quand l'implémentation change :

- Architecture, frontières, abstractions → `architecture.md`
- Modèle de stockage → `architecture.md` (Storage Model)
- Conventions → `code-standards.md`
- Tokens, composants, motifs visuels → `ui-context.md` et `ui-registry.md` (via `/imprint`)
- Nouvelle dépendance ou piège découvert → `library-docs.md`
- Périmètre fonctionnel → `project-overview.md` (et signaler l'écart avec le CDC)
- Décision prise → `progress-tracker.md` (Architecture Decisions)

## Before Moving to the Next Unit

1. L'unité fonctionne de bout en bout dans son périmètre et remplit le critère de fin du `build-plan.md`.
2. Aucun invariant de `architecture.md` n'est violé.
3. `/review` (verdict APPROUVÉ ou APPROUVÉ AVEC CORRECTIONS traitées) puis `/audit` ont été exécutés, et le développeur a statué sur chaque problème.
4. `progress-tracker.md` reflète le travail terminé.
5. `npm run lint`, `npm run typecheck`, `npm run test` et `npm run build` passent.
6. Si l'unité touche l'IA, le pipeline ou le score : `npm run eval` exécuté et résultat consigné dans Eval History.
