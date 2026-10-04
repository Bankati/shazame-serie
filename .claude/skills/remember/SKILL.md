---
name: remember
description: Sauvegarder l'essentiel en fin de session pour que la session suivante reprenne exactement au même point (/remember save), ou restaurer ce contexte au début d'une nouvelle session (/remember restore). Ne conserve jamais de secret.
---

# Remember (rappel)

L'IA n'a pas de mémoire entre les sessions. Chaque session repart de zéro. Ce skill règle ce problème : on l'exécute en fin de session pour sauvegarder, en début de session pour restaurer.

## Frontière de sécurité

Ne **jamais** écrire de secret dans `memory.md` : clés d'API, jetons d'accès ou de session, mots de passe, codes à usage unique, clés privées, cookies, en-têtes d'authentification, chaînes de connexion (`DATABASE_URL`…), secrets de webhook, clé `service_role` Supabase, identifiants de paiement réels.

Si un détail utile est sensible, écrire un substitut : `[REDACTED_OPENAI_KEY]`. En cas de doute, considérer que c'est sensible.

Ne pas non plus copier de données personnelles d'utilisateurs de test réels (emails, noms).

## Invocation

```
/remember save      # fin de session
/remember restore   # début de session
```

`/remember` seul → demander lequel des deux.

---

## Mode save

### Quoi capturer

Uniquement ce qu'un développeur aussi compétent que vous, mais qui ne sait rien de la session, devrait savoir pour continuer. Pas une transcription.

- **Ce qui a été construit** : unité(s) du build plan (et chemin du plan validé dans `context/plans/`), fichiers précis créés ou modifiés, état fonctionnel. Pas « fait l'auth » mais « créé `src/app/(auth)/connexion/page.tsx`, `src/server/auth/require-user.ts`, `src/proxy.ts` ; inscription email + Google fonctionnent de bout en bout en préproduction ».
- **Décisions prises** : choix difficiles à défaire ou dont dépend la suite (et s'ils ont été reportés dans `progress-tracker.md`).
- **Problèmes résolus** : ce qui a pris du temps, pour ne pas le refaire. Ex. « le pooler Supabase exige `prepare: false` ».
- **État actuel** : ce qui marche, ce qui est partiel, ce qui est cassé ; dernier résultat de `npm run eval` si l'IA a été touchée.
- **Prochaine étape** : la toute première action de la prochaine session, assez précise pour démarrer sans réfléchir.
- **Questions ouvertes** : ce qui reste à trancher.

### Quoi ne pas capturer

- Ce qui se lit dans le code ou se déduit du dépôt.
- Ce qui est déjà dans les fichiers de `context/`.
- Le récit de comment on a construit.
- Tout secret ou donnée sensible.

### Contrôle avant écriture

Relire le contenu, retirer ou masquer toute valeur sensible.

### Où sauvegarder

`memory.md` à la racine du projet. Il contient uniquement l'état de la dernière session.

S'il existe déjà :

```
memory.md existe déjà (session précédente).
Contenu actuel : [résumé en une ligne].

Le remplacer par la mémoire de cette session ? (oui / non)
```

Attendre la réponse. « non » → `Aucune modification. memory.md est inchangé.`

### Format

```markdown
# Memory — [Unité ou nom de session]

Dernière mise à jour : [date et heure]

## Ce qui a été construit
## Décisions prises
## Problèmes résolus
## État actuel
## La prochaine session commence par
## Questions ouvertes
```

Puis :

```
Mémoire enregistrée dans memory.md.
Prochaine session : lancez /remember restore pour reprendre ici.
```

Rappeler aussi de mettre à jour `context/progress-tracker.md` si ce n'est pas fait.

---

## Mode restore

### Étape 1 — Trouver la mémoire

Chercher `memory.md` à la racine. Absent :

```
Aucun memory.md dans ce projet.
Soit c'est la première session, soit la mémoire n'a pas été enregistrée.
Pour l'enregistrer en fin de session : /remember save.
```

### Étape 2 — Lire

Lire `memory.md`, puis uniquement ces fichiers s'ils existent :

- `CLAUDE.md`
- `context/progress-tracker.md`
- `context/build-plan.md` (l'unité en cours seulement)
- `context/plans/<ID>.md` de l'unité en cours, s'il existe
- `.cursorrules`, `.cursor/rules/`, `.windsurfrules`, `AGENTS.md`, `.clinerules`, `.github/copilot-instructions.md` (si un autre outil est utilisé)

Ne pas parcourir d'autres fichiers à ce stade. Ne jamais afficher un secret trouvé : le mentionner sous forme masquée.

### Étape 3 — Confirmer

Ne rien construire. Résumer :

```
Mémoire restaurée. Voici où nous en sommes :

Dernière session : [ce qui a été construit]
État actuel : [ce qui fonctionne]
Décisions en place : [décisions clés]
Prochaine étape : [première action]

Est-ce exact ? Répondez oui pour continuer, ou corrigez ce qui ne va pas.
```

Attendre la confirmation.

### Mémoire incomplète

```
J'ai trouvé memory.md mais il manque du contexte : [ce qui manque].
On continue avec ce qu'on a, ou vous complétez d'abord ?
```

Ne pas deviner.

---

## La règle

Chaque session se termine par `/remember save`. Chaque session commence par `/remember restore`. Utilisé de temps en temps, il ne sert à rien ; utilisé toujours, plus rien ne se perd.
