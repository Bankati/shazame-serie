# UI Context

## Theme

**Mise à jour du 23 octobre 2026 (AD-49, U44) : thème sombre au choix.** Bouton `ThemeToggle` dans les en-têtes ; next-themes pose `.dark` sur `<html>` (clair par défaut, système ignoré). Jetons sombres dans le bloc `.dark` de `globals.css` : fond #141414, cartes #1F1F1F, bouton #C2185B, accent texte `text-brand-strong` #FF8FC4, liens et focus #B9A3FF. Toujours passer par les jetons : un composant juste en clair l'est en sombre. Exception documentée : coque du téléphone de démonstration (`dark:bg-secondary`).

**Mise à jour du 23 octobre 2026 (AD-48, U43) : thème clair unique et nouvelle palette du fondateur** — framboise `#9E0059`, violet `#390099`, blanc cassé `#F8F9FA`. La classe `.dark` n'est plus posée (les variantes `dark:` de shadcn ne s'appliquent plus). Fond `#F8F9FA`, cartes blanches, texte `#1A1325`. Bouton d'action `bg-primary` framboise, texte blanc (8,1:1), survol `#7D0047`. `--ring` et `--link` violet (12:1). Surfaces de contraste `bg-inverse` = violet de la marque (hero animé, étapes, pellicule, pied de page, en-tête de fiche) ; dessus, l'accent texte est `text-brand-light` (`#FFB3D6`, 7,8:1) et `.bg-inverse` redéfinit `--ring` et `--link` en rose clair. `text-brand-strong` (framboise) sur fond clair uniquement. Les valeurs et contrastes à jour sont dans `src/app/globals.css` ; les paragraphes suivants (vert, thème sombre) sont historiques.

**Mise à jour du 21 octobre 2026 (AD-45, U37) : accent unique, le vert du logo.** `--primary` vaut désormais #10B981 avec un texte foncé (`--primary-foreground` #05080E, 7,9:1) ; survol #34D399 ; `--ring` et `--link` #34D399. Le bleu n'est plus utilisé. Grands titres en deux tons avec le composant `TwoTone` (mot clé en `text-brand-strong`, ou `text-brand` sur `bg-inverse`) ; sur-titres en `text-xs font-semibold uppercase tracking-widest text-brand-strong`. Un bouton d'action est toujours le bouton principal shadcn (`bg-primary`), jamais un `bg-brand` composé à la main.

**Mise à jour du 16 octobre 2026 (AD-35, maquette du fondateur de type plateforme de streaming) : thème sombre unique**, classe `.dark` posée sur `<html>`. Les valeurs à jour des jetons sont dans `src/app/globals.css` (contrastes mesurés en commentaire) ; le tableau « Colors » ci-dessous garde les noms et les usages, ses valeurs hexadécimales claires sont historiques. Nouveau jeton `--link` (`text-link`, `#60A5FA`) : tout lien texte l'utilise, `text-primary` (bleu des boutons, 3,7:1 sur le fond) n'est plus utilisé pour du texte. Le produit s'adresse à des cinéphiles : ce sont les **affiches** qui apportent la couleur.

Texte d'origine (U02, remplacé) : thème clair uniquement en V1, interface sobre et blanche.

Direction : une salle de projection en plein jour. Fond clair et neutre, typographie de générique de film (titres condensés, forts), et un seul élément mémorable : **la pellicule** — la bande d'images extraites du clip qui s'affiche pendant l'analyse, sur fond noir de marque, avec perforations, chaque image validée ou écartée sous les yeux de l'utilisateur. Toute l'audace visuelle est concentrée là ; le reste est calme et discipliné.

Identité imposée par le cahier des charges : vert `#10B981`, bleu `#0052CC`, noir `#1F2937`.

## Colors

Les composants utilisent **les noms de classes de shadcn/ui** (`bg-background`, `text-foreground`, `bg-primary`…), complétés de quelques tokens propres au projet. Un seul vocabulaire : pas de deuxième système de noms. Aucune valeur hexadécimale dans les composants.

| Rôle | Variable CSS | Classe Tailwind | Valeur | Contraste / usage |
| --- | --- | --- | --- | --- |
| Fond de page | `--background` | `bg-background` | `#F6F7F9` | |
| Surface (cartes, panneaux) | `--card` | `bg-card` | `#FFFFFF` | Texte : `text-card-foreground` |
| Menus, modales | `--popover` | `bg-popover` | `#FFFFFF` | |
| Surface discrète, squelettes | `--muted` | `bg-muted` | `#EEF1F5` | |
| Texte principal | `--foreground` | `text-foreground` | `#1F2937` | 14,7:1 sur blanc |
| Texte secondaire | `--muted-foreground` | `text-muted-foreground` | `#4B5563` | 7,2:1 sur `--background`, 6,7:1 sur `--muted` |
| Accent principal | `--primary` | `bg-primary`, `text-primary` | `#0052CC` | Boutons principaux, liens. Texte blanc dessus : 6,8:1 |
| Texte sur accent | `--primary-foreground` | `text-primary-foreground` | `#FFFFFF` | |
| Accent survol | `--primary-hover` | `bg-primary-hover` | `#003D99` | |
| Secondaire | `--secondary` | `bg-secondary` | `#EEF1F5` | Texte `text-secondary-foreground` = `#1F2937` |
| Survol neutre | `--accent` | `bg-accent` | `#EEF1F5` | Convention shadcn (survol de menus) — ce n'est **pas** la couleur de marque |
| Surface inversée | `--inverse` | `bg-inverse` | `#1F2937` | Pellicule, pied de page, hero, blocs sombres |
| Texte secondaire sur surface inversée | `--inverse-muted` | `text-inverse-muted` | `#D1D5DB` | 9,9:1 sur `bg-inverse` (ajouté en U02) |
| Texte sur surface inversée | `--inverse-foreground` | `text-inverse-foreground` | `#FFFFFF` | |
| Vert de marque | `--brand` | `bg-brand` | `#10B981` | Remplissages, indicateurs, éléments sur `bg-inverse` (5,8:1). **Jamais en texte ni en icône sur fond clair (2,5:1).** |
| Vert texte | `--brand-strong` | `text-brand-strong` | `#047857` | Vert lisible sur fond clair (5,5:1) |
| Fond badge « Très probable » | `--brand-subtle` | `bg-brand-subtle` | `#ECFDF5` | |
| Texte badge « Très probable » | `--brand-subtle-foreground` | `text-brand-subtle-foreground` | `#065F46` | 7,3:1 |
| Bordure décorative | `--border` | `border-border` | `#E5E7EB` | Séparateurs, contours de cartes. Jamais pour un champ |
| Contour de champ | `--input` | `border-input` | `#6B7280` | 4,8:1 (critère WCAG 1.4.11) |
| Anneau de focus | `--ring` | `ring-ring`, `outline-ring` | `#0052CC` | |
| Erreur | `--destructive` | `text-destructive`, `bg-destructive` | `#B91C1C` | 6,5:1 sur blanc |
| Avertissement | `--warning` | `text-warning` | `#B45309` | 5,0:1 sur blanc (confiance moyenne, quota bas) |
| Succès | `--success` | `text-success` | `#047857` | |

### Mise en place (U02)

1. `npx shadcn@latest init` (Tailwind 4, style par défaut, couleur de base neutre).
2. Dans `src/app/globals.css`, **remplacer les valeurs** générées par shadcn dans `:root` par celles du tableau, puis ajouter les tokens propres au projet. Supprimer le bloc `.dark` généré (thème clair uniquement en V1, AD-08) ou le laisser vide.
3. Ajouter au bloc `@theme inline` généré **uniquement** les correspondances manquantes :

```css
:root {
  /* valeurs shadcn remplacées */
  --radius: 0.625rem;
  --background: #F6F7F9;
  --foreground: #1F2937;
  --card: #FFFFFF;
  --card-foreground: #1F2937;
  --popover: #FFFFFF;
  --popover-foreground: #1F2937;
  --primary: #0052CC;
  --primary-foreground: #FFFFFF;
  --secondary: #EEF1F5;
  --secondary-foreground: #1F2937;
  --muted: #EEF1F5;
  --muted-foreground: #4B5563;
  --accent: #EEF1F5;
  --accent-foreground: #1F2937;
  --destructive: #B91C1C;
  --border: #E5E7EB;
  --input: #6B7280;
  --ring: #0052CC;
  /* tokens propres au projet */
  --primary-hover: #003D99;
  --inverse: #1F2937;
  --inverse-foreground: #FFFFFF;
  --brand: #10B981;
  --brand-strong: #047857;
  --brand-subtle: #ECFDF5;
  --brand-subtle-foreground: #065F46;
  --warning: #B45309;
  --success: #047857;
}

@theme inline {
  /* à ajouter à côté des correspondances générées par shadcn */
  --color-primary-hover: var(--primary-hover);
  --color-inverse: var(--inverse);
  --color-inverse-foreground: var(--inverse-foreground);
  --color-brand: var(--brand);
  --color-brand-strong: var(--brand-strong);
  --color-brand-subtle: var(--brand-subtle);
  --color-brand-subtle-foreground: var(--brand-subtle-foreground);
  --color-warning: var(--warning);
  --color-success: var(--success);
  --radius-poster: 2px;
  --font-sans: var(--font-public-sans);
  --font-display: var(--font-archivo);
  --text-display: 2rem;
  --text-display--line-height: 1.05;
  --text-display-lg: 3rem;
  --text-display-lg--line-height: 1.05;
}
```

Écarts constatés à l'installation (U02, shadcn 4.21.4, preset `radix-nova`) : couleurs générées en `oklch` (remplacées par les valeurs du tableau), variables `sidebar-*` et `chart-*` retirées (inutiles en V1), `--font-heading` (utilisé par les titres de `Dialog` et `Sheet`) relié à Archivo, `--font-display--font-variation-settings: "wdth" 75` pour l'effet condensé, token `--text-display-xl` (4,5 rem) pour le titre du hero. La variante `dark` reste liée à la classe `.dark` (jamais posée) : sinon les classes `dark:` des composants suivraient le thème du système.

Vérifier après `init` que les variables générées portent bien ces noms (le format exact peut évoluer avec la CLI) et adapter ce bloc si besoin, puis noter l'écart ici.

## Typography

| Rôle | Police | Variable `next/font` | Usage |
| --- | --- | --- | --- |
| Display | Archivo, axe de largeur `wdth` ≈ 75, graisses 700–800 | `--font-archivo` → classe `font-display` | Titres de films, titres de pages, compteur de quota. Effet générique de cinéma |
| Interface | Public Sans, 400 / 500 / 600 | `--font-public-sans` → classe `font-sans` | Tout le reste |

Chargées dans `src/app/layout.tsx` via `next/font/google` (`subsets: ['latin']`, `display: 'swap'`, `variable: '--font-archivo'` / `'--font-public-sans'`, `axes: ['wdth']` pour Archivo). Les classes de variables sont posées sur `<html>`. Pas de police monospace en V1.

| Usage | Classes |
| --- | --- |
| Titre du film (fiche, résultat) | `font-display text-display md:text-display-lg font-bold` |
| Titre de page | `font-display text-2xl md:text-3xl font-bold` |
| Titre de section | `text-xl md:text-2xl font-semibold` |
| Texte courant | `text-base` (16 px, jamais moins de 14 px) |
| Métadonnées, légendes | `text-sm text-muted-foreground` |

Règles : casse de phrase partout (pas de libellés en majuscules), synopsis limité à `max-w-prose`, pas de mot isolé mis en couleur dans un titre.

## Border Radius

Échelle de shadcn avec `--radius: 0.625rem` :

| Contexte | Classe | Valeur |
| --- | --- | --- |
| Badges | `rounded-sm` | 6 px |
| Champs | `rounded-md` | 8 px |
| Boutons (preset shadcn « radix-nova », généré) | `rounded-lg` | 10 px |
| Cartes, panneaux | `rounded-lg` | 10 px |
| Cartes de section des pages vitrines (étapes, arguments, tarifs, FAQ) et carte d'envoi | `rounded-xl` | 14 px (AD-23) |
| Blocs sombres pleine largeur dans le conteneur (confidentialité, appel final, pages d'erreur) | `rounded-2xl` | 18 px (AD-23) |
| Pastilles (sur-titre du hero), cercles d'icône | `rounded-full` | |
| Modales, feuille mobile (haut seulement : `rounded-t-xl`) | `rounded-xl` | 14 px |
| Affiches | `rounded-poster` | 2 px — une affiche reste un rectangle |
| Pellicule | `rounded-none` | 0 |

## Spacing, Elevation

- Échelle Tailwind par pas de 4 px. Espacements usuels : `gap-2` (éléments inline), `gap-4` (dans une carte), `gap-8` (entre sections), padding de carte `p-4` mobile / `p-6` desktop.
- Marges de page : `px-4` mobile, `px-6` tablette, conteneur `max-w-6xl mx-auto` sur desktop.
- Ombres : aucune par défaut. Séparation par fond (`bg-card` sur `bg-background`) et bordure `border-border`. Seuls les menus, modales et la carte d'envoi posée sur le hero sombre ont `shadow-lg`.
- Hauteur des boutons : le preset Nova génère des boutons de 32 px ; nos composants posent `h-11` (44 px) pour respecter les zones tactiles.

## Component Library

shadcn/ui sur Tailwind 4. Les composants vivent dans `src/components/ui/` et s'ajoutent avec la CLI (`npx shadcn@latest add button`), jamais écrits à la main. Les composants métier vivent dans `src/components/<feature>/` et composent ceux de `ui/`.

Composants métier attendus en V1 :

| Composant | Rôle |
| --- | --- |
| `ClipDropzone` | Zone d'envoi (glisser, sélectionner), contraintes visibles : formats, 500 Mo (U33) |
| `FilmStrip` | **Élément signature.** Bande noire à perforations, images extraites qui apparaissent une à une, marquées retenue / écartée |
| `QuotaCounter` | « 12 identifications restantes aujourd'hui » toujours visible, passe en avertissement à ≤ 3 |
| `IdentificationResult` | Titre, affiche, année, confiance, alternatives, bouton de signalement |
| `ConfidenceBadge` | Pourcentage + libellé texte, jamais la couleur seule |
| `AlternativeList` | 3 alternatives compactes cliquables |
| `TitleHeader`, `CastRow`, `TrailerPlayer`, `WatchProviders`, `SimilarTitles` | Blocs de la fiche |
| `PosterCard` | Affiche + titre + année, ratio 2:3, `next/image` avec tailles TMDB adaptées |
| `Paywall` | Invitation au Premium, non bloquante pour les fiches |
| `ReportDialog` | Signalement avec recherche du bon titre et case de consentement non cochée par défaut |

### Confiance : seuils d'affichage

| Confiance | Libellé | Style |
| --- | --- | --- |
| ≥ 80 % | « Très probable » | `bg-brand-subtle text-brand-subtle-foreground`, icône check |
| 50–79 % | « Probable » | Texte `text-warning`, icône info, alternatives mises en avant |
| < 50 % | Pas de résultat principal | Message « Nous n'avons pas reconnu ce clip avec assez de certitude », alternatives éventuelles, proposition d'un autre extrait. Non décompté. |

## Layout Patterns

- **Navigation** : barre supérieure fine sur `bg-card` avec bordure basse `border-border` : logo, compteur de quota, liens Liste / Historique, avatar. Sur mobile : logo + quota + menu.
- **Accueil (mobile d'abord)** : la zone d'envoi occupe le premier écran ; aucune section marketing avant l'action. Direction validée en U02 (AD-23, références Netflix, Flowblox, Bankai) : hero `bg-inverse` avec mosaïque de cadres d'affiches et bande de pellicule, puis sections claires alternant `bg-background` et `bg-card` (étapes numérotées, grille asymétrique d'arguments, bloc sombre confidentialité, tarifs, FAQ en accordéon, appel final sombre), pied de page `bg-inverse` en colonnes.

```
┌──────────────────────────────┐
│ Logo            12 restantes │
├──────────────────────────────┤
│ Quel est ce film ?           │
│ ┌──────────────────────────┐ │
│ │  Choisir un clip         │ │
│ │  MP4, MOV, MKV… · 500 Mo │ │
│ └──────────────────────────┘ │
│ ▓▓ pellicule (pendant l'analyse) ▓▓ │
│ Résultat                     │
└──────────────────────────────┘
```

- **Résultat** : affiche à gauche (desktop) ou en haut (mobile), titre en `font-display`, badge de confiance, actions « Voir la fiche » (principal) et « Ajouter à ma liste » (secondaire), alternatives dessous, signalement en lien discret.
- **Fiche titre** : en-tête large avec affiche et métadonnées, puis sections dans cet ordre fixe : Où regarder → Bande-annonce → Synopsis → Distribution → Titres similaires → Mention des sources.
- **Compte** : colonne unique `max-w-2xl`, sections empilées.
- **Admin** : barre latérale fixe sur desktop, tableaux denses, aucun effet décoratif.
- **Modales** : centrées sur desktop, feuille glissant du bas sur mobile, fond assombri.

## States

- **Chargement** : squelettes en `bg-muted` aux dimensions finales (pas de saut de mise en page). Pendant l'identification, la pellicule fait office d'indicateur de progression avec étapes textuelles : « Extraction des images », « Analyse », « Recherche de la fiche ».
- **Vide** : une phrase qui dit quoi faire + un bouton. Ex. liste vide : « Votre liste est vide. Ajoutez un titre depuis une fiche. »
- **Erreur** : dire ce qui s'est passé et comment corriger, sans s'excuser. Ex. « Cette vidéo dépasse 500 Mo. Coupez-la ou choisissez un autre extrait. »

## Writing

- **Vouvoiement** (confirmé par le fondateur, Q13).
- Typographie française : espace insécable avant `? ! : ;` et à l'intérieur des guillemets « », dans tous les textes de `src/content/fr/`.
- Verbes d'action précis : « Choisir un clip », « Ajouter à ma liste », « Passer au Premium ». Le même mot reste le même dans tout le parcours (le bouton « Ajouter à ma liste » produit le message « Ajouté à votre liste »).
- Pas de flèches ajoutées aux libellés, pas de points médians pour séparer les métadonnées : utiliser des virgules ou des éléments séparés.

## Icons

lucide-react, icônes au trait uniquement. Tailles : `size-4` en ligne, `size-5` dans les boutons, `size-6` dans la navigation. Toute icône seule dans un bouton a un `aria-label`.

## Motion

- **Mise à jour du 16 octobre 2026 (AD-36, demande du fondateur : « beaucoup d'animations »)** : bibliothèque Motion (`motion/react`, composants `m.*` sous `LazyMotion` + `domAnimation`, `MotionProvider` dans le layout) et carrousels Embla. Accueil : vedette en fondu enchaîné avec zoom lent (`animate-ken-burns`), textes en cascade, rangées d'affiches qui apparaissent en cascade et se soulèvent au survol, genres avec recomposition animée, sections révélées au défilement (`Reveal`).
- **Mise à jour du 23 octobre 2026 (AD-48, U43)** : GSAP pour le hero et « Comment ça marche » (téléphone de démonstration qui rejoue une identification ; section épinglée environ 1,5 écran sur ordinateur, boucle quand visible sur mobile ; inclinaison vers la souris). Motion reste utilisé ailleurs (rangées, `Reveal`, liste). Vedette en carrousel retirée. Pellicule de la dernière section en défilement continu (`animate-film-scroll`). Avec « moins d'animations », GSAP ne lance rien (`gsap.matchMedia`) et le téléphone montre l'écran du résultat.
- Règle de performance : toute animation décorative continue se met en pause pendant l'analyse d'un clip (`data-pause-motion` posé par `IdentifyPanel`), sinon l'extraction des images ralentit fortement.
- Moment orchestré du produit : l'apparition des images dans la pellicule puis la révélation du résultat (fenêtre).
- `prefers-reduced-motion` : toutes les animations sont remplacées par un affichage immédiat (`MotionConfig reducedMotion="user"`, règle CSS globale, carrousel de la vedette sans défilement automatique). Le défilement automatique a un bouton pause.

## Accessibility (WCAG 2.1 AA)

- Contraste ≥ 4,5:1 pour le texte, ≥ 3:1 pour les contours de contrôles et icônes informatives.
- Zones tactiles ≥ 44 × 44 px.
- Focus visible partout (`--ring`).
- Le résultat d'identification est annoncé par une région `aria-live="polite"`.
- Texte alternatif de chaque affiche : « Affiche de {titre} ({année}) ».
- Zoom à 200 % sans perte de contenu ; aucune information portée par la seule couleur.
