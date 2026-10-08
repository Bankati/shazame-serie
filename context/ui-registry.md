# UI Registry

Registre des motifs visuels réellement implémentés. Alimenté par `/imprint` après chaque composant. À consulter **avant** de créer un composant. Les classes reprennent le vocabulaire de `ui-context.md` (noms shadcn/ui + tokens du projet).

## Baseline — établie le 4 octobre 2026 (à partir de `ui-context.md`, avant tout code)

| Propriété | Classe correcte |
| --- | --- |
| Fond de page | `bg-background text-foreground` |
| Carte | `bg-card text-card-foreground border border-border rounded-lg` |
| Padding de carte | `p-4 md:p-6` |
| Écart dans une carte | `gap-4` |
| Écart entre sections | `gap-8` |
| Bouton principal | `<Button className="h-11 … hover:bg-primary-hover">` (variante `default`, `rounded-lg` du preset Nova) |
| Bouton d'action sur surface sombre | `<Button className="h-11 bg-brand text-inverse hover:bg-brand/85">` (5,8:1) |
| Bouton secondaire | `<Button variant="outline" className="h-11">` (preset Nova : `border-border bg-background hover:bg-muted`) |
| Lien | `text-primary underline-offset-4 hover:underline` |
| Champ de saisie | `<Input>` : `border-input rounded-md` |
| Texte secondaire | `text-sm text-muted-foreground` |
| Titre de film | `font-display text-display md:text-display-lg font-bold` |
| Affiche | `rounded-poster aspect-[2/3]` |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (fourni par shadcn) |
| Ombre | aucune (sauf menus, modales et carte d'envoi sur le hero : `shadow-lg`) |
| Carte de section (pages vitrines) | `rounded-xl border border-border bg-card p-6` (ou `bg-background` sur une section `bg-card`) |
| Bloc sombre | `rounded-2xl bg-inverse text-inverse-foreground p-6 md:p-12`, texte secondaire `text-inverse-muted` |
| Section | `px-4 sm:px-6 py-16 md:py-24`, conteneur `mx-auto max-w-6xl`, `scroll-mt-16` si ancre |
| Lien d'ancre / navigation | `min-h-11 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring` |
| Surface inversée (pellicule) | `bg-inverse text-inverse-foreground rounded-none` |
| Badge « Très probable » | `bg-brand-subtle text-brand-subtle-foreground rounded-sm` |
| Badge « Probable » | `text-warning` + icône, fond `bg-muted` |
| Erreur de champ | `text-sm text-destructive` |

Note : `aspect-[2/3]` est une valeur arbitraire de **proportion**, autorisée. L'interdiction des valeurs arbitraires concerne les couleurs, rayons, tailles de texte et espacements.

## Composants

Enregistrés le 7 octobre 2026 (U02).

### SiteHeader + MobileNav

Fichiers : `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-card` (en-tête collant `sticky top-0 z-40`), feuille `bg-popover` (Sheet) |
| Bordure | `border-b border-border` |
| Radius | liens `rounded-md` |
| Texte principal | liens desktop `text-sm font-medium text-muted-foreground hover:text-foreground` ; mobile `text-base font-medium` |
| Espacement | hauteur `h-16`, `gap-1` entre liens, `px-3` par lien |
| Hover / focus | `hover:bg-accent` (mobile), `focus-visible:outline-2 focus-visible:outline-ring` |
| Ombre | none (Sheet : `shadow-lg` généré) |
| Accent | bouton « Identifier un clip » `h-11 px-5 hover:bg-primary-hover` |

**Notes de pattern :** navigation complète et bouton d'action à partir de `lg` (1 024 px) ; menu mobile en dessous (`lg:hidden`) — à `md`, les libellés passaient sur deux lignes. Le bouton de fermeture généré du Sheet (libellé anglais) est masqué (`showCloseButton={false}`) et remplacé par un bouton `size-11` avec `aria-label` français. Le Sheet se ferme au clic sur un lien.

### Logo

Fichier : `src/components/layout/logo.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | pastille `bg-brand size-8 rounded-md`, icône `text-inverse` |
| Texte principal | `font-display text-xl font-bold`, `text-foreground` ou `text-inverse-foreground` (`tone="inverse"`) |
| Hover / focus | `min-h-11 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Accent | vert de marque en **remplissage** uniquement |

### SiteFooter

Fichier : `src/components/layout/site-footer.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-inverse text-inverse-foreground` |
| Bordure | séparateur `border-t border-inverse-foreground/10` |
| Texte secondaire | `text-sm text-inverse-muted`, titres de colonne `text-sm font-semibold` |
| Espacement | `py-12 md:py-16`, `gap-10`, grille `md:grid-cols-4` |
| Hover / focus | liens `hover:text-inverse-foreground hover:underline focus-visible:outline-brand`, `min-h-11` |

**Notes de pattern :** mention TMDB (formule de non-affiliation) et JustWatch obligatoires (invariant 12).

### SectionHeading

Fichier : `src/components/home/section-heading.tsx`

| Propriété | Classe |
| --- | --- |
| Texte principal | `font-display text-display md:text-display-lg font-bold` |
| Texte secondaire | `text-base md:text-lg text-muted-foreground` (`text-inverse-muted` en `tone="inverse"`) |
| Accent | sur-titre `text-sm font-semibold text-brand-strong` (fond clair) ou `text-brand` (fond sombre) |
| Espacement | `gap-3`, `max-w-2xl` |

### Hero + ClipDropzonePreview

Fichiers : `src/components/home/hero.tsx`, `src/components/home/clip-dropzone-preview.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | section `bg-inverse` + `PosterWall` ; carte `bg-card text-card-foreground` |
| Bordure | zone de dépôt `border-2 border-dashed border-input rounded-lg` ; pastille `border border-inverse-foreground/20 bg-inverse-foreground/5 rounded-full` |
| Radius | carte `rounded-xl` |
| Texte principal | titre `font-display text-display-lg md:text-display-xl font-extrabold` |
| Texte secondaire | `text-inverse-muted` (hero), `text-sm text-muted-foreground` (carte) |
| Espacement | carte `p-4 md:p-6`, zone `px-4 py-8 gap-4` |
| Ombre | `shadow-lg` (carte posée sur le hero sombre, exception documentée) |
| Accent | icône d'envoi `text-primary` dans `bg-muted rounded-full`, cadenas `text-brand-strong` |

**Notes de pattern :** bouton « Choisir un clip » `disabled` avec `aria-describedby` vers le message « ouvre très bientôt » ; remplacé par `ClipDropzone` en U06.

### HowItWorks (carte d'étape)

Fichier : `src/components/home/how-it-works.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-card` sur section `bg-background` |
| Bordure | `border border-border` |
| Radius | `rounded-xl` ; pastille d'icône `rounded-lg bg-muted size-11` |
| Texte principal | numéro `font-display text-display-lg font-extrabold text-primary` (décoratif, `aria-hidden`), titre `text-xl font-semibold` |
| Texte secondaire | `text-muted-foreground` |
| Espacement | `p-6 gap-4`, grille `gap-4 md:grid-cols-3` |

### Features (grille asymétrique)

Fichier : `src/components/home/features.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | carte vedette `bg-inverse text-inverse-foreground` (`md:col-span-2`) ; `bg-brand-subtle text-brand-subtle-foreground` ; `bg-background` sur section `bg-card` |
| Bordure | cartes claires `border border-border` |
| Radius | `rounded-xl` ; cadres d'affiche décoratifs `rounded-poster aspect-[2/3]` |
| Texte principal | titre vedette `font-display text-display font-bold`, autres `text-xl font-semibold` |
| Espacement | `p-6 md:p-8 gap-3` |
| Accent | icônes `size-6` : `text-brand` sur sombre, `text-primary` sur clair ; badge exemple `bg-brand-subtle text-brand-subtle-foreground rounded-sm` + icône check |

### Privacy (bloc sombre)

Fichier : `src/components/home/privacy.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-inverse text-inverse-foreground rounded-2xl p-6 md:p-12` |
| Bordure | séparateur de point `border-t border-inverse-foreground/15 pt-6` |
| Texte secondaire | `text-inverse-muted` |
| Accent | icônes `text-brand` (autorisé sur `bg-inverse`) |

### PricingTeaser

Fichier : `src/components/home/pricing-teaser.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-background` sur section `bg-card` |
| Bordure | `border border-border` ; offre mise en avant `border-2 border-primary` |
| Radius | `rounded-xl` |
| Texte principal | prix `font-display text-display-lg font-extrabold`, nom `text-xl font-semibold` |
| Accent | `<Badge>` par défaut (`bg-primary`), coches `text-brand-strong size-5` |

**Notes de pattern :** boutons `disabled` « Bientôt disponible » jusqu'aux unités de paiement.

### Faq

Fichier : `src/components/home/faq.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-card` |
| Bordure | `border border-border rounded-xl`, items `border-border` (séparateurs générés) |
| Texte principal | déclencheur `min-h-11 py-4 text-base font-semibold` |
| Texte secondaire | réponse `text-base text-muted-foreground` |
| Hover / focus | générés par l'Accordion shadcn (`focus-visible:ring-3 ring-ring/50`) |

### FinalCta + ErrorScreen

Fichiers : `src/components/home/final-cta.tsx`, `src/components/layout/error-screen.tsx` (utilisé par `not-found.tsx` et `error.tsx`)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-inverse text-inverse-foreground rounded-2xl` + `FilmStripDecor` en tête |
| Texte principal | `font-display text-display md:text-display-lg font-bold` |
| Texte secondaire | `text-inverse-muted` |
| Accent | bouton `h-11 bg-brand text-inverse hover:bg-brand/85` ; bouton secondaire sur sombre `variant="outline" border-inverse-foreground/30 bg-transparent text-inverse-foreground hover:bg-inverse-foreground/10` |

**Notes de pattern :** `global-error.tsx` reprend ces classes en HTML brut (il remplace le layout et ne peut pas utiliser les composants de la coquille).

### PosterWall et FilmStripDecor (décors)

Fichiers : `src/components/decor/poster-wall.tsx`, `src/components/decor/film-strip-decor.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | tuiles `bg-inverse-foreground/10` à `/20`, `bg-primary/40` à `/60`, `bg-brand/25` à `/40` ; voile `bg-linear-to-b from-inverse/35 via-inverse/70 to-inverse` |
| Bordure | `border border-inverse-foreground/10` |
| Radius | affiches `rounded-poster` ; images de pellicule `rounded-none` ; perforations `rounded-sm size-3 bg-inverse-foreground/25` |

**Notes de pattern :** toujours `aria-hidden`. Pas d'affiches réelles tant que la licence TMDB n'est pas obtenue (Q2). `FilmStripDecor` annonce l'élément signature `FilmStrip` (U06), qui en reprendra les perforations.
