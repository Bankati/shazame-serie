---
name: review
description: Relire ligne par ligne un diff ou une PR avant fusion, comme un relecteur senior. Cherche les bugs de logique, les failles de sécurité, les erreurs non gérées, les tests manquants et le code difficile à maintenir, puis rend des commentaires précis (fichier:ligne) avec une suggestion. Complète /audit, qui vérifie la conformité de l'unité au plan et au système. N'applique aucune modification.
---

# Review

`/audit` répond à « l'unité est-elle conforme au plan, à l'architecture et au design system ? ».
`/review` répond à « ce code est-il juste, sûr et maintenable, ligne par ligne ? ».

Les deux sont nécessaires. Un code peut respecter toutes les frontières de l'architecture et contenir un bug de fuseau horaire, une condition de concurrence ou un `await` oublié.

## Usage

```
/review                 # diff de la branche courante vs main
/review [fichier]       # un fichier précis
/review staged          # uniquement les changements indexés (avant commit)
```

## Place dans le cycle

```
implémentation → /review (sur le diff) → corrections → /audit (sur l'unité) → fusion
```

Lancer `/review` aussi souvent que nécessaire pendant une unité, au minimum avant d'ouvrir la PR.

## Étape 1 — Délimiter

1. Récupérer le diff : `git diff main...HEAD` (ou `git diff --staged`).
2. Lire le plan validé `context/plans/<ID>.md` et l'unité dans `context/build-plan.md` pour savoir ce que le code est censé faire.
3. Pour chaque fichier modifié, lire assez de contexte autour du diff pour comprendre l'appelant et l'appelé. Ne pas relire tout le projet.
4. Lire `context/code-standards.md` et, pour toute librairie touchée, sa section de `context/library-docs.md`.

Si le diff dépasse ~600 lignes hors fichiers générés, le signaler : une PR de cette taille ne se relit pas correctement et l'unité aurait dû être découpée.

Ignorer : `src/components/ui/*`, `drizzle/*` générés, fichiers de verrouillage. Les signaler seulement s'ils ont été modifiés à la main.

## Étape 2 — Relire selon ces axes

### Exactitude

- Logique conditionnelle : cas limites (0, vide, `null`, seuil exact de 50 %, 15e et 16e identification, minuit à Paris, changement d'heure).
- Asynchrone : `await` oubliés, promesses non gérées, appels en série qui pourraient être parallèles, conditions de concurrence (deux identifications simultanées, webhook reçu deux fois).
- Types : assertions (`as`) qui masquent une erreur, `!` non justifié, données externes utilisées sans validation zod.
- Effets de bord : écritures hors transaction alors qu'elles doivent être atomiques ; quota réservé mais jamais libéré sur un chemin d'erreur.

### Sécurité

- Vérification de session **et** de propriété avant toute lecture ou mutation.
- Entrées non validées, SQL hors Drizzle, contenu affiché sans échappement.
- Secrets ou clé `service_role` atteignables côté client ; variable `NEXT_PUBLIC_*` qui ne devrait pas l'être.
- Données sensibles dans les journaux, Sentry, l'analytique ou les messages d'erreur renvoyés.
- Webhook : corps brut, signature, idempotence.
- Fichiers reçus : type réel, taille, nombre.

### Gestion des erreurs

- Chaque appel externe : délai, tentatives (RG16), erreur traduite en code normalisé.
- `catch` vides ou qui avalent l'erreur ; erreurs inattendues non envoyées à Sentry.
- Message utilisateur en français, clair, sans détail technique.

### Performance

- Requêtes N+1, données chargées puis filtrées en mémoire, absence d'index sur une colonne filtrée.
- Appels TMDB ou IA évitables (cache ignoré).
- Composant client qui pourrait être serveur ; dépendance lourde ajoutée au bundle navigateur.
- Fuites mémoire côté navigateur (URL d'objet non révoquées, écouteurs non retirés).

### Tests

- La logique nouvelle a-t-elle des tests ? Couvrent-ils les cas limites relevés plus haut ?
- Les tests vérifient-ils un comportement ou seulement qu'une fonction a été appelée ?
- Un bug corrigé est-il accompagné du test qui l'aurait détecté ?
- Aucun test n'appelle une API payante réelle.

### Lisibilité et maintenabilité

- Noms qui disent ce que fait la chose ; nombres magiques à remplacer par des constantes nommées.
- Fonctions trop longues ou à plusieurs responsabilités.
- Duplication d'une logique déjà présente ailleurs dans le dépôt.
- Commentaires qui expliquent le « pourquoi » quand le code n'est pas évident ; commentaires obsolètes.
- Code mort, `console.log`, TODO sans question ouverte associée dans `progress-tracker.md`.

## Étape 3 — Rendre les commentaires

Un commentaire par problème, du plus grave au moins grave :

```markdown
## Review — [branche ou fichier]

Fichiers relus : [n] — Lignes ajoutées / supprimées : [+a / -b]

### Bloquant
- `src/server/quota/reserve.ts:42` — Le quota réservé n'est pas libéré si TMDB échoue après l'appel IA : l'utilisateur perd une identification (contraire à RG16).
  Suggestion : libérer dans un `finally` conditionné à `!committed`.

### À corriger
- `[fichier:ligne]` — [problème] — Suggestion : [changement concret, extrait de code court si utile]

### Suggestion
- `[fichier:ligne]` — [amélioration non obligatoire]

### Question
- `[fichier:ligne]` — [point dont l'intention n'est pas claire]

### Points positifs
- [ce qui est bien fait et mérite d'être réutilisé — une à trois lignes]

### Verdict
APPROUVÉ / APPROUVÉ AVEC CORRECTIONS / CHANGEMENTS REQUIS
```

Niveaux :

- **Bloquant** : bug qui produit un mauvais résultat, faille de sécurité, perte de données, risque financier (quota, coût IA, paiement), invariant violé.
- **À corriger** : cas limite non géré qu'un utilisateur rencontrera, test manquant sur une logique critique, erreur mal gérée, écart aux standards.
- **Suggestion** : lisibilité, petite optimisation, nommage.
- **Question** : intention incertaine ; ne pas supposer, demander.

Règles d'écriture :

- Toujours `fichier:ligne`, toujours le pourquoi, toujours une piste concrète.
- Critiquer le code, jamais la personne.
- Ne pas noyer un bloquant sous dix remarques de style : si les suggestions dépassent dix, ne garder que les plus utiles.
- Ne rien affirmer sur une API sans l'avoir vérifié dans la doc de la version installée.

## Étape 4 — S'arrêter

Ne rien modifier. Attendre que le développeur :

- demande d'appliquer une ou plusieurs corrections (citer leur emplacement) ;
- réponde à une question ;
- indique qu'un point est volontaire.

Après corrections, relancer `/review` sur le nouveau diff seulement.

## Principe

Une bonne relecture trouve ce que les tests ne voient pas encore. Elle doit être précise, justifiée et utile, pas exhaustive pour le principe.
