---
name: recover
description: Quand quelque chose ne marche pas pendant le développement, diagnostiquer d'abord le type de défaillance (bug isolé, session dégradée, mauvaise hypothèse) avant d'agir, puis appliquer la bonne réponse : correction ciblée, réinitialisation propre ou remise en question de l'approche. Utiliser dès qu'une erreur persiste ou que les corrections s'enchaînent sans succès.
---

# Recover

Tous les problèmes ne sont pas des bugs, et tous les bugs ne se règlent pas en déboguant.

Le mauvais réflexe : décrire le problème, demander une correction, obtenir une version encore cassée, recommencer. La session s'allonge, le contexte se pollue, le code se dégrade. Ici, on **diagnostique d'abord**, on agit ensuite. Deux étapes distinctes.

## Étape 1 — Décrire le problème

Écouter sans intervenir. Demander :

```
Décrivez précisément le problème :
- Qu'attendiez-vous ?
- Que s'est-il passé à la place ? (message d'erreur exact, capture, sortie de commande)
- Combien de tentatives de correction ont déjà été faites ?
```

La dernière question dit si le problème est neuf ou si la session est déjà dégradée.

## Étape 2 — Identifier le mode de défaillance

### Mode 1 — Un élément précis est cassé
Signes : problème isolé (un composant, une fonction, une route), le reste marche, peu de tentatives, erreur claire.
→ **Correction ciblée** (3A).

### Mode 2 — La session est devenue incohérente
Signes : plusieurs corrections ont empiré la situation, code de plus en plus confus, problème initial flou.
→ **Réinitialisation** (3B).

### Mode 3 — La base du raisonnement est fausse
Signes : le code tourne mais le comportement est fondamentalement faux ; mauvaise compréhension d'une API, d'un besoin ou de l'architecture ; corriger les détails ne change rien.
→ **Remise en question** (3C).

Pièges fréquents de **ce** projet, souvent en Mode 3 :

- API utilisée de mémoire alors que la version installée a changé (Next 16, Zod 4, Tailwind 4, React 19) → relire `context/library-docs.md` et la doc officielle.
- Supposer qu'une réponse est mise en cache par Next alors qu'elle ne l'est pas (ou l'inverse).
- Jour de quota calculé en UTC au lieu d'Europe/Paris.
- Session Supabase lue depuis le cookie au lieu d'être vérifiée par `auth.getUser()`.
- Webhook vérifié sur un corps JSON reparsé au lieu du corps brut.
- Comportement vidéo différent sur Safari iOS (`playsInline`, `muted`, événement `seeked`).
- Classes de couleur qui « ne marchent pas » : nom de token absent du bloc `@theme inline` de `globals.css`, ou couleur Tailwind brute utilisée au lieu du vocabulaire de `ui-context.md`.
- Eval anormalement bonne au deuxième passage : le cache n'a pas été contourné (`bypassCache`).
- Précision d'identification attribuée au code alors qu'elle dépend de la consigne ou du modèle → mesurer avec `npm run eval` avant de conclure.

Annoncer :

```
Il s'agit du Mode [1/2/3] — [nom].
[Une phrase qui justifie ce choix.]
Voici comment nous allons procéder :
```

## Étape 3A — Correction ciblée (Mode 1)

1. Comprendre avant de modifier : message exact, fichier ou fonction, attendu vs réel. Ne pas analyser tout le projet.
2. Cause racine :
   ```
   Cause racine : [explication précise]
   Différence avec le symptôme : [explication]
   ```
3. Correction :
   ```
   Correction : [modification]
   Pourquoi cela fonctionne : [explication]
   Test qui l'aurait détecté : [test à ajouter]
   ```
4. **Attendre la validation** avant de modifier.
5. Si la correction échoue : ne pas enchaîner une autre solution ; revoir le diagnostic. Deux diagnostics ratés de suite → envisager le Mode 2 ou 3.

## Étape 3B — Réinitialisation (Mode 2)

```
La session a dérivé trop loin pour être réparée par petites touches.
Continuer ici aggraverait le problème. Un redémarrage propre sera plus efficace.
Ce n'est pas un échec, c'est la bonne décision.
```

Rédiger une note et proposer de l'enregistrer dans `memory.md` via `/remember save` :

```markdown
## Reset — [ID] [Nom de l'unité]

### Objectif initial
[...]

### Problèmes rencontrés
[...]

### Ce qu'il faut éviter
[...]

### Point de départ
[ce qui peut être conservé : fichiers, commits, tests]

### Commande pour revenir à un état sain
[ex. git stash / git checkout <commit> — à valider par le développeur]
```

Puis :

```
Étapes suivantes :
1. Sauvegarder cette note (/remember save)
2. Terminer cette session
3. Ouvrir une nouvelle session
4. /remember restore
5. Repartir de la note, en relançant /architect si le plan doit changer
```

Ne jamais lancer de commande destructrice (reset, suppression de branche) sans accord explicite.

## Étape 3C — Remise en question (Mode 3)

```
Le problème principal n'est pas un bug mais une hypothèse incorrecte :
Hypothèse : [supposition initiale]
Réalité : [ce qui est vrai, avec la source : doc, fichier de contexte, mesure]
L'approche actuelle ne peut donc pas être corrigée simplement.
```

```
Approche correcte : [description]
Différence avec l'approche actuelle : [explication]
À abandonner : [éléments]
À conserver : [éléments]
Fichiers de contexte à mettre à jour : [library-docs.md, architecture.md…]
```

Ne pas coder. Demander :

```
Ce diagnostic correspond-il à votre compréhension ?
- Oui → on repart sur la bonne base
- Non → dites-moi ce qui est incorrect
```

## Principe

Le pire réflexe est d'insister dans la même direction. Comprendre le type de problème d'abord, agir ensuite. Bien diagnostiquer, c'est déjà plus de la moitié de la solution.
