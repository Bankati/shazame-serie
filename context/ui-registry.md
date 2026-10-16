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

### Hero + IdentifyPanel

Fichiers : `src/components/home/hero.tsx`, `src/components/identify/identify-panel.tsx`
Dernière mise à jour : 14 octobre 2026 (U06, remplace `ClipDropzonePreview`)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | section `bg-inverse` + `PosterWall` ; carte `bg-card text-card-foreground` |
| Bordure | pastille `border border-inverse-foreground/20 bg-inverse-foreground/5 rounded-full` |
| Radius | carte `rounded-xl` |
| Texte principal | titre `font-display text-display-lg md:text-display-xl font-extrabold` ; état `text-sm font-medium text-foreground` |
| Texte secondaire | `text-inverse-muted` (hero), `text-sm text-muted-foreground` (carte) |
| Espacement | carte `p-4 md:p-6`, contenu `flex flex-col gap-4`, mention de confidentialité `mt-4 gap-2` |
| Hover / focus | bouton « Choisir un autre clip » `variant="outline"` shadcn, `h-11` |
| Ombre | `shadow-lg` (carte posée sur le hero sombre, exception documentée) |
| Accent | cadenas `text-brand-strong` |

**Notes de pattern :** depuis U12, le résultat est rendu par `IdentificationResult` (squelette pendant l'analyse). La carte porte `min-w-0` (élément de grille : elle ne doit pas s'élargir pour contenir la pellicule, débordement constaté à 412 px). L'état du parcours est annoncé par un `<p aria-live="polite">`. La carte affiche `ClipDropzone` (repos, refus) ou `FilmStrip` + état + bouton (extraction, prêt, insuffisant).

### ClipDropzone

Fichier : `src/components/identify/clip-dropzone.tsx`
Dernière mise à jour : 14 octobre 2026 (U06)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | zone transparente ; en glisser-déposer `bg-muted` ; icône dans `bg-muted rounded-full size-14` |
| Bordure | `border-2 border-dashed border-input` ; en glisser-déposer `border-primary` |
| Radius | `rounded-lg` |
| Texte principal | `font-display text-2xl font-bold` |
| Texte secondaire | `text-sm text-muted-foreground` ; erreur `text-sm font-medium text-destructive` (`role="alert"`) |
| Espacement | `px-4 py-8 gap-4` |
| Hover / focus | bouton shadcn par défaut `h-11 w-full max-w-xs text-base` (focus visible du composant `ui`) ; `transition-colors` sur la zone |
| Ombre | none |
| Accent | icône d'envoi `text-primary` |

**Notes de pattern :** le champ fichier est `sr-only`, `tabIndex={-1}`, `aria-hidden` : l'accès clavier et mobile passe par le bouton, qui pointe vers les contraintes (et l'erreur) par `aria-describedby`. La valeur du champ est vidée après chaque choix pour pouvoir reprendre le même fichier. L'indice « ou glissez-le ici » n'apparaît qu'à partir de `md`.

### FilmStrip (élément signature)

Fichier : `src/components/identify/film-strip.tsx`
Dernière mise à jour : 14 octobre 2026 (U06)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-inverse text-inverse-foreground` ; case vide `bg-inverse-foreground/10` |
| Bordure | case `border border-inverse-foreground/10` |
| Radius | bande `rounded-lg` ; images `rounded-none` ; perforations `rounded-sm` |
| Texte principal | statut retenu `text-xs leading-tight font-medium` |
| Texte secondaire | en attente ou écartée `text-xs leading-tight text-inverse-muted` |
| Espacement | `py-2`, grille `grid-cols-5 gap-1.5 px-2 my-2`, case `gap-1` |
| Hover / focus | none (non interactif) |
| Ombre | none |
| Accent | coche « Retenue » `text-brand` (fond sombre uniquement) ; image écartée `opacity-40` |

**Notes de pattern :** `<figure>` + `<figcaption className="sr-only">` + liste ordonnée de 5 cases. Chaque état est écrit (« Retenue », « Trop sombre », « Floue », « Doublon », « En attente ») : jamais la couleur seule. Apparition des images `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300` (le seul moment orchestré, coupé avec `prefers-reduced-motion`). Aperçus en `<img>` (URL `blob:` locale), pas `next/image`. Perforations réutilisées depuis `film-strip-decor.tsx` avec `overflow-hidden`.

### IdentificationResult (carte de résultat)

Fichier : `src/components/identify/identification-result.tsx`
Dernière mise à jour : 16 octobre 2026 (U12)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | hérité de la carte `IdentifyPanel` (`bg-card`) ; squelette `bg-muted` (`Skeleton`) |
| Bordure | none |
| Radius | affiche `rounded-poster` ; squelette d'affiche `rounded-poster` |
| Texte principal | titre `font-display text-2xl leading-tight font-bold` |
| Texte secondaire | année et type `text-sm text-muted-foreground` ; « non reconnu » `text-sm text-foreground` |
| Espacement | carte `flex flex-col gap-4` ; bloc titre `flex gap-4`, colonne `gap-2` |
| Hover / focus | aucun sur la carte ; voir `AlternativeList` |
| Ombre | none |
| Accent | `ConfidenceBadge` |

**Notes de pattern :** affiche principale 96 px de large (w342 TMDB), à gauche aussi sur mobile. Sans résultat principal (`ask_another_clip`) : message puis « Pistes possibles ». Un clic sur une piste l'affiche en principal, la précédente rejoint la liste. Squelette `IdentificationResultSkeleton` aux dimensions finales (affiche `h-36 w-24`). Zone d'actions sous le badge : « Voir la fiche » (bouton principal `h-11 px-5 text-base hover:bg-primary-hover`, U15) ; « Ajouter à ma liste » (U18) et « Ce n'est pas le bon titre » (U20) à ajouter quand l'action existe.

### ConfidenceBadge

Fichier : `src/components/identify/confidence-badge.tsx`
Dernière mise à jour : 16 octobre 2026 (U12)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | ≥ 80 % `bg-brand-subtle` ; sinon aucun |
| Bordure | none |
| Radius | `rounded-sm` (≥ 80 %) |
| Texte principal | ≥ 80 % `text-sm font-medium text-brand-subtle-foreground` ; 50-79 % `text-warning` ; < 50 % `text-muted-foreground` |
| Texte secondaire | none |
| Espacement | `px-2 py-1 gap-1` (≥ 80 %), `gap-1` sinon |
| Hover / focus | none (non interactif) |
| Ombre | none |
| Accent | icônes `Check` (≥ 80), `Info` (50-79), `CircleHelp` (< 50), `size-4` |

**Notes de pattern :** toujours un libellé et un pourcentage (« Très probable, 94 % », « Probable, 65 % », « Piste possible, 40 % ») : jamais la couleur seule. Seuils 80 et 50 identiques à `scoring.ts` (U09).

### AlternativeList

Fichier : `src/components/identify/alternative-list.tsx`
Dernière mise à jour : 16 octobre 2026 (U12)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | ligne transparente, `hover:bg-muted` |
| Bordure | none |
| Radius | ligne `rounded-md` ; miniature `rounded-poster` |
| Texte principal | titre `text-sm font-medium text-foreground` (tronqué) |
| Texte secondaire | intitulé de section et pourcentage `text-sm text-muted-foreground` |
| Espacement | section `gap-2`, liste `gap-1`, ligne `min-h-11 px-2 py-1 gap-3` |
| Hover / focus | `hover:bg-muted`, `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Ombre | none |
| Accent | none |

**Notes de pattern :** chaque piste est un `<button>` (clavier) avec `aria-label` « Afficher {titre} ({année}) comme résultat ». Miniature 32 px (w92 TMDB).

### TitlePoster

Fichier : `src/components/identify/title-poster.tsx`
Dernière mise à jour : 16 octobre 2026 (U12)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-muted` (pendant le chargement et sans affiche) |
| Bordure | none |
| Radius | `rounded-poster` |
| Texte principal | none |
| Texte secondaire | none |
| Espacement | none |
| Hover / focus | none |
| Ombre | none |
| Accent | sans affiche : icône `Film` `size-6 text-muted-foreground` |

**Notes de pattern :** ratio 2:3 calculé depuis la largeur. `next/image` avec `unoptimized` (TMDB sert déjà la taille, l'optimiseur Vercel est facturé). Texte alternatif « Affiche de {titre} ({année}) » (ui-context.md) ; sans affiche, `role="img"` et « Affiche indisponible ». Réutilisable par `PosterCard` (U15).

### QuotaCounter

Fichier : `src/components/layout/quota-counter.tsx` (dans `SiteHeader`)
Dernière mise à jour : 16 octobre 2026 (U12)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | none (sur `bg-card` de l'en-tête) |
| Bordure | none |
| Radius | none |
| Texte principal | `text-sm font-medium text-muted-foreground` ; ≤ 3 restantes `text-warning` |
| Texte secondaire | none |
| Espacement | `gap-1.5` ; dans l'en-tête `gap-3` avec le menu |
| Hover / focus | none (non interactif) |
| Ombre | none |
| Accent | icône `Clapperboard` `size-4` |

**Notes de pattern :** texte court sur mobile (« 2 restantes »), complet à partir de `sm` (« 2 identifications restantes aujourd'hui »). Région `aria-live="polite"`. Alimenté par `useQuota()` (`GET /api/quota`, puis chaque réponse d'identification). Rien n'est affiché tant que le quota n'est pas connu (pas de saut de mise en page notable dans l'en-tête).

### Fiche titre : TitleHeader, TrailerPlayer, CastRow, SimilarTitles (PosterCard), SourceAttribution

Fichiers : `src/components/title/` (`title-view.tsx` assemble les blocs)
Dernière mise à jour : 16 octobre 2026 (U15)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | en-tête `bg-inverse text-inverse-foreground` (comme le hero) ; lecteur `bg-inverse rounded-lg` ; sources `bg-card border border-border rounded-lg p-4` |
| Bordure | sources `border-border` |
| Radius | affiches et photos `rounded-poster` ; lecteur et encadré des sources `rounded-lg` ; cartes cliquables `rounded-md` (focus) |
| Texte principal | titre `font-display text-display-lg md:text-display-xl font-extrabold` ; titres de section `font-display text-display font-bold` ; noms `text-sm font-medium text-foreground` |
| Texte secondaire | en-tête `text-inverse-muted` ; rôle, motif, mentions `text-sm text-muted-foreground` |
| Espacement | en-tête `px-4 py-8 md:py-12 gap-6`, contenu `py-10 md:py-14 gap-10`, section `gap-4`, grille des similaires `gap-4` (2 / 3 / 5 colonnes) |
| Hover / focus | carte similaire `group-hover:underline`, `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` ; lecteur `hover:bg-inverse/90` + même focus |
| Ombre | none |
| Accent | bouton de lecture `bg-brand text-inverse rounded-full size-14` (fond sombre) ; genres `Badge variant="secondary"` |

**Notes de pattern :** ordre fixe des sections (ui-context.md) : Où regarder (U16, en premier) → Bande-annonce → Synopsis → Distribution → Titres similaires → Sources. La bande-annonce n'appelle YouTube qu'au clic (`youtube-nocookie.com`). Accroche entre guillemets français avec espaces insécables. Distribution : défilement horizontal (`overflow-x-auto`, marges négatives `-mx-4` compensées sur mobile). Logo TMDB `public/brand/tmdb-logo.svg` + mention des conditions TMDB (invariant 12). `TitlePoster` accepte `alt` pour les photos (« Photo de {nom} »).

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

**Notes de pattern :** toujours `aria-hidden`. Pas d'affiches réelles tant que la licence TMDB n'est pas obtenue (Q2). `Perforations` (exporté, prop `count`, `className`) est partagé avec `FilmStrip` (U06).
