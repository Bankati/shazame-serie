---
name: audit
description: Après avoir développé une unité, vérifier qu'elle correspond au plan, respecte l'architecture, les invariants, le design system et les standards du projet, et qu'elle est prête pour la production. Signale les problèmes avec leur gravité sans rien corriger. Utiliser après chaque unité, avant de passer à la suivante.
---

# Audit

Le développement n'est pas terminé quand le code fonctionne. Il est terminé quand le code est correct.

Cette compétence **ne corrige rien**. Elle signale ce qu'elle trouve, et le développeur décide.

## Étape 1 — Établir le référentiel

Lire dans cet ordre :

1. Le plan validé de l'unité : `context/plans/<ID>.md` (produit par `/architect`).
2. L'unité dans `context/build-plan.md`, en particulier son **critère de fin**.
3. `context/architecture.md` (invariants), `context/code-standards.md`, `context/ui-context.md`, `context/ui-registry.md`.
4. Le diff de l'unité (`git diff main...HEAD`) et les fichiers touchés.

Sans plan ni description, demander au développeur ce que l'unité devait faire. On ne peut pas juger correct ce dont on ignore la cible.

## Étape 2 — Vérifier sur trois niveaux

### Niveau 1 — Alignement avec le plan

- Tous les éléments du plan et du périmètre de l'unité sont-ils présents ?
- Le critère de fin du build plan est-il démontré (test, commande, parcours) ?
- Les décisions de `/architect` sont-elles visibles dans le code ?
- Quelque chose a-t-il été ajouté hors périmètre ?

### Niveau 2 — Intégrité du système

**Invariants — vérifier chacun explicitement.** La source de vérité est la section Invariants de `context/architecture.md` : si elle diffère de la liste ci-dessous, c'est elle qui fait foi (et ce skill doit être mis à jour).

1. Aucune vidéo envoyée au serveur ; 2 à 5 images, ≤ 1,5 Mo, type réel vérifié.
2. Aucun import du SDK OpenAI hors `src/server/ai/` ; garde de dépense et coût enregistrés.
3. Décompte uniquement via `quota.commit()` après résultat ≥ 50 % d'origine IA ; toute réservation confirmée ou libérée (chercher les chemins d'erreur).
4. Empreintes du cache calculées par le serveur, jamais reprises du client.
5. Statut Premium modifié seulement par webhook vérifié et idempotent ou action admin journalisée.
6. Mutation admin + journal d'audit dans la même transaction.
7. Validation zod puis session, rôle et propriété avant toute logique, dans chaque route **et** Server Action.
8. Pas de logique métier ni d'accès base dans `src/app/**`.
9. Aucune donnée sensible dans les journaux, Sentry, l'analytique.
10. Pas d'usage B2B sans consentement.
11. Pas de travail long après la réponse dans un route handler.
12. Mention TMDB / source streaming présente si l'unité affiche une fiche.
13. Aucune migration appliquée modifiée.

**Architecture** : bonnes frontières (`server/`, `client/`, `components/`, `app/`), `import 'server-only'` présent, abstractions fournisseurs respectées.

**Design system** : vocabulaire de classes de `ui-context.md` uniquement (aucune couleur hexadécimale, aucune valeur arbitraire de couleur, rayon, texte ou espacement), `bg-brand` jamais en texte ni en icône sur fond clair, `border-input` pour les champs et `border-border` pour les séparateurs, rayons et espacements conformes au registre, `src/components/ui/*` non modifié, `/imprint` exécuté pour chaque composant UI.

**Standards de code** : TypeScript strict sans `any`, forme de réponse API `{ ok, data | error }`, codes d'erreur normalisés, textes dans `src/content/fr/`, nommage, montants en entiers, dates UTC.

**Cohérence** : un motif existant a-t-il été dupliqué au lieu d'être réutilisé ?

### Niveau 3 — Prêt pour la production

- **Erreurs** : chaque appel externe a un délai, des tentatives (RG16) et un message clair ; aucun échec silencieux.
- **Cas particuliers** : états vide, chargement, erreur ; visiteur vs connecté vs Premium vs suspendu ; quota épuisé ; plafond IA atteint ; clip invalide ; TMDB sans résultat ; pays sans service de streaming.
- **Accessibilité** : clavier, focus visible, `aria-live` pour le résultat, textes alternatifs, contraste, zones tactiles ≥ 44 px.
- **Performance** : budget JS, images `next/image` dimensionnées, pas de requête en cascade évitable.
- **Technique** : console navigateur et terminal propres, `lint`, `typecheck`, `test`, `build` verts ; `eval` exécuté si l'IA, le score, le cache ou l'extraction d'images sont touchés.
- **Critère de fin** : chaque élément du critère de fin du build plan est démontré, pas seulement affirmé.
- **Bugs évidents** pour un utilisateur réel sur téléphone Android en 4G.

## Étape 3 — Rapport

```markdown
## Audit — [ID] [Nom de l'unité]

### Niveau 1 — Alignement avec le plan
PASS / PROBLÈMES DÉTECTÉS
- [Critique|Important|Mineur] [constat] — [fichier:ligne]

### Niveau 2 — Intégrité du système
PASS / PROBLÈMES DÉTECTÉS
- [gravité] [constat] — [fichier:ligne] — [invariant ou règle concerné]

### Niveau 3 — Prêt pour la production
PASS / PROBLÈMES DÉTECTÉS
- [gravité] [constat] — [fichier:ligne]

### Résumé
[X] problèmes détectés sur [Y] niveaux ([a] critiques, [b] importants, [c] mineurs).
```

Sans problème : « Aucun problème détecté. Cette unité est prête pour la production. »
Avec problèmes : « Corrigez les éléments ci-dessus avant de passer à l'unité suivante. »

Ne pas minimiser. Un invariant violé est toujours **Critique**.

## Étape 4 — Laisser le développeur décider

Après le rapport : s'arrêter. Si tout est PASS, rappeler de mettre à jour `progress-tracker.md` (unité en Completed, prochaine unité en Next Up). Ne pas corriger, ne pas proposer de solution tant qu'on ne le demande pas. Attendre que le développeur demande une correction précise, déclare un point volontaire, ou confirme que tout est réglé.

## Guide de gravité

- **Critique** : invariant violé, échec silencieux, fonctionnalité prévue absente, faille de sécurité, risque financier (quota, coût IA, paiement).
- **Important** : écart au design system, aux standards, cas particulier qu'un utilisateur réel rencontrera, problème d'accessibilité.
- **Mineur** : nommage, optimisation, style sans impact fonctionnel.

La question n'est pas « est-ce que ça fonctionne ? » mais « est-ce que c'est correct ? ».
