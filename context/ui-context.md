# UI Context

## Theme

Thème **clair uniquement en V1** (le thème sombre est une préférence prévue en V2 : les tokens sont structurés pour l'ajouter sans toucher aux composants). Le produit s'adresse à des cinéphiles : ce sont les **affiches** qui apportent la couleur. L'interface reste sobre, blanche et dense en information, pour que les visuels des films ressortent.

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
| Surface inversée | `--inverse` | `bg-inverse` | `#1F2937` | Pellicule, pied de page |
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
| Boutons, champs | `rounded-md` | 8 px |
| Cartes, panneaux | `rounded-lg` | 10 px |
| Modales, feuille mobile (haut seulement : `rounded-t-xl`) | `rounded-xl` | 14 px |
| Affiches | `rounded-poster` | 2 px — une affiche reste un rectangle |
| Pellicule | `rounded-none` | 0 |

## Spacing, Elevation

- Échelle Tailwind par pas de 4 px. Espacements usuels : `gap-2` (éléments inline), `gap-4` (dans une carte), `gap-8` (entre sections), padding de carte `p-4` mobile / `p-6` desktop.
- Marges de page : `px-4` mobile, `px-6` tablette, conteneur `max-w-6xl mx-auto` sur desktop.
- Ombres : aucune par défaut. Séparation par fond (`bg-card` sur `bg-background`) et bordure `border-border`. Seuls les menus et modales ont `shadow-lg`.

## Component Library

shadcn/ui sur Tailwind 4. Les composants vivent dans `src/components/ui/` et s'ajoutent avec la CLI (`npx shadcn@latest add button`), jamais écrits à la main. Les composants métier vivent dans `src/components/<feature>/` et composent ceux de `ui/`.

Composants métier attendus en V1 :

| Composant | Rôle |
| --- | --- |
| `ClipDropzone` | Zone d'envoi (glisser, sélectionner), contraintes visibles : formats, 60 s, 50 Mo |
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
- **Accueil (mobile d'abord)** : la zone d'envoi occupe le premier écran ; un exemple concret en dessous ; aucune section marketing avant l'action.

```
┌──────────────────────────────┐
│ Logo            12 restantes │
├──────────────────────────────┤
│ Quel est ce film ?           │
│ ┌──────────────────────────┐ │
│ │  Choisir un clip         │ │
│ │  MP4, MOV, WebM · 60 s   │ │
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
- **Erreur** : dire ce qui s'est passé et comment corriger, sans s'excuser. Ex. « Ce clip dure plus de 60 secondes. Coupez-le ou choisissez un autre extrait. »

## Writing

- Tutoiement ou vouvoiement : **vouvoiement** (cible 16–45 ans, ton respectueux et simple). À confirmer avec le fondateur.
- Verbes d'action précis : « Choisir un clip », « Ajouter à ma liste », « Passer au Premium ». Le même mot reste le même dans tout le parcours (le bouton « Ajouter à ma liste » produit le message « Ajouté à votre liste »).
- Pas de flèches ajoutées aux libellés, pas de points médians pour séparer les métadonnées : utiliser des virgules ou des éléments séparés.

## Icons

lucide-react, icônes au trait uniquement. Tailles : `size-4` en ligne, `size-5` dans les boutons, `size-6` dans la navigation. Toute icône seule dans un bouton a un `aria-label`.

## Motion

- Un seul moment orchestré : l'apparition des images dans la pellicule puis la révélation du résultat.
- Ailleurs : transitions courtes (150 ms) en réponse à une action (ouverture de menu, ajout à la liste).
- `prefers-reduced-motion` : toutes les animations sont remplacées par un affichage immédiat.

## Accessibility (WCAG 2.1 AA)

- Contraste ≥ 4,5:1 pour le texte, ≥ 3:1 pour les contours de contrôles et icônes informatives.
- Zones tactiles ≥ 44 × 44 px.
- Focus visible partout (`--ring`).
- Le résultat d'identification est annoncé par une région `aria-live="polite"`.
- Texte alternatif de chaque affiche : « Affiche de {titre} ({année}) ».
- Zoom à 200 % sans perte de contenu ; aucune information portée par la seule couleur.
