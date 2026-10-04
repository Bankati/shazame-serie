---
name: imprint
description: Après avoir construit ou modifié un composant UI, extraire ses motifs visuels (fond, bordure, rayon, texte, espacement, états, accent) et les enregistrer dans context/ui-registry.md pour que les composants suivants restent cohérents. Mode audit pour détecter les incohérences sur l'interface existante. Utiliser après chaque composant UI.
---

# Imprint

La cohérence d'une interface n'arrive pas par hasard : elle existe parce que chaque composant est construit en tenant compte des précédents. L'agent ne se souvient pas de ce qu'il a fait il y a trois sessions ; ce registre s'en souvient pour lui.

## Usage

```
/imprint                    # composants récemment créés ou modifiés
/imprint [chemin_du_fichier]
/imprint audit              # toute l'interface
```

Sans fichier précisé : repérer les fichiers modifiés sous `src/components/` et `src/app/` (`git status`, `git diff main...HEAD --name-only`). À défaut, demander : « Quel composant dois-je analyser ? »

## Référentiel

- `context/ui-context.md` : vocabulaire de classes (shadcn/ui + tokens du projet), règles (source de vérité).
- `context/ui-registry.md` : baseline + composants déjà enregistrés.

Toute valeur qui ne vient pas d'un token est un écart à signaler, pas un motif à enregistrer.

## Étape 1 — Extraire ce qui compte pour la cohérence

À extraire : arrière-plan, bordure (couleur, épaisseur), rayon, couleurs de texte, tailles et graisses, espacements (padding, gap), états (hover, focus-visible, active, disabled), ombre, accent de marque.

À ignorer : largeurs et hauteurs, flex/grid, positionnement, breakpoints, animations (sauf règle importante, comme la pellicule).

## Étape 2 — Vérifier contre les règles du projet

Avant d'écrire, signaler toute infraction :

- Couleur hexadécimale ou valeur arbitraire de couleur, rayon, taille de texte ou espacement (`bg-[#…]`, `rounded-[…]`, `text-[…]`, `p-[…]`). Les proportions (`aspect-[2/3]`) sont permises.
- Classe hors vocabulaire de `ui-context.md` (ex. une couleur Tailwind brute comme `bg-blue-600` ou `text-gray-500`).
- `bg-brand` / vert de marque utilisé en couleur de texte ou d'icône sur fond clair (utiliser `text-brand-strong`).
- `border-border` sur un champ de saisie (doit être `border-input`).
- Rayon hors échelle (`rounded-sm` badges, `rounded-md` boutons et champs, `rounded-lg` cartes, `rounded-xl` modales, `rounded-poster` affiches).
- Ombre sur une carte (non prévu).
- Focus non visible ou absent.
- Confiance ou état indiqué par la seule couleur.
- Fichier de `src/components/ui/` modifié à la main.

## Étape 3 — Écrire dans `context/ui-registry.md`

Ajouter ou mettre à jour l'entrée sous « Composants », sans écraser les autres :

```markdown
### [NomDuComposant]

Fichier : [chemin]
Dernière mise à jour : [date]

| Propriété | Classe |
| --- | --- |
| Arrière-plan | [classe] |
| Bordure | [classe] |
| Radius | [classe] |
| Texte principal | [classe] |
| Texte secondaire | [classe] |
| Espacement | [classe] |
| Hover / focus | [classe] |
| Ombre | [classe ou none] |
| Accent | [classe ou none] |

**Notes de pattern :** [décisions, variantes autorisées, règles à respecter]
```

## Étape 4 — Confirmer

```
Imprint de [Composant] → context/ui-registry.md

Capturé :
- Background : [classe]
- Bordure : [classe]
- Radius : [classe]
- Texte : [classes]
- Espacement : [classes]
- États : [classes]

Les futurs composants de ce type doivent respecter ces règles.
```

En cas d'écart : `Note : [élément incohérent et règle concernée]`.

## Mode audit — `/imprint audit`

À utiliser si plusieurs sessions se sont passées sans `/imprint`, ou si l'interface semble incohérente (prévu à l'unité U31).

1. Parcourir `src/components/**` et `src/app/**`, relever les motifs visuels.
2. Lister les conflits : rayons, fonds, couleurs de texte, espacements, bordures, états, valeurs en dur.
3. Rapport, sans rien corriger :

```
Audit UI

Conflits détectés :
- [catégorie] : [variantes trouvées] — [fichiers]

Valeurs en dur à remplacer :
- [fichier:ligne] [valeur] → [token]

Recommandation : standardiser sur la baseline de ui-registry.md (ou [proposition]).
```

4. Validation :

```
Audit terminé. [X] conflits détectés.
1. Les recommandations vous conviennent-elles ?
2. Dois-je ajuster certains choix ?
3. Dois-je traiter les valeurs en dur comme des erreurs ?
```

5. Après accord : mettre à jour la baseline, puis lister les composants à corriger (`[fichier] → [problème] → doit être [classe]`).

## Règle

Créer un composant → `/imprint` → passer à la suite. Toujours.
