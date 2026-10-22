# UI Registry

Registre des motifs visuels réellement implémentés. Alimenté par `/imprint` après chaque composant. À consulter **avant** de créer un composant. Les classes reprennent le vocabulaire de `ui-context.md` (noms shadcn/ui + tokens du projet).

> **16 octobre 2026 : thème sombre (AD-35).** Les noms de classes de la baseline restent valables (les jetons ont changé de valeur, pas de nom). Exception : un lien texte utilise désormais `text-link` (et non `text-primary`).

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

**Notes de pattern :** mis à jour le 16 octobre 2026 (U04) : liens d'ancre à partir de `xl` (1 280 px), menu mobile en dessous (`xl:hidden`) ; bouton d'action et compte (`AccountMenu`) à partir de `lg`. Libellés et logo en `whitespace-nowrap` : avec le nom « SHAZAM SERIE » et le lien « Se connecter », l'en-tête passait sur deux lignes à 1 280 px. Le menu mobile porte aussi le compte (pastille + email + « Se déconnecter », ou « Se connecter » / « Créer un compte » en `variant="outline"` sur deux colonnes). Le bouton de fermeture généré du Sheet (libellé anglais) est masqué (`showCloseButton={false}`) et remplacé par un bouton `size-11` avec `aria-label` français. Le Sheet se ferme au clic sur un lien.

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
| Arrière-plan | section `bg-inverse` + `CurvedFilmBand` sous un voile `bg-linear-to-b from-inverse/50 via-inverse/70 to-inverse` (16 octobre 2026) ; carte `bg-card text-card-foreground` |
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

**Notes de pattern :** depuis U34, sélection multiple (`multiple`, `accept` vidéos + images) : une vidéo lance le clip, 1 à 5 images le mode captures (tri par `classifySelection`, erreurs dans la même zone `role="alert"`) ; titre « Choisir un clip ou des captures », libellé du bouton inchangé. `accept="video/*,.mp4,.mov,…"` depuis U33 (les galeries des téléphones proposent toutes les vidéos ; le contrôle trie ensuite). Le champ fichier est `sr-only`, `tabIndex={-1}`, `aria-hidden` : l'accès clavier et mobile passe par le bouton, qui pointe vers les contraintes (et l'erreur) par `aria-describedby`. La valeur du champ est vidée après chaque choix pour pouvoir reprendre le même fichier. L'indice « ou glissez-le ici » n'apparaît qu'à partir de `md`.

### Navigation de l'application : AppHeader, AppTabBar, FloatingIdentify

Fichiers : `src/components/layout/app-header.tsx`, `app-tab-bar.tsx`, `floating-identify.tsx`, `app-nav.ts`
Dernière mise à jour : 21 octobre 2026 (U38)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | en-tête `bg-background/85 backdrop-blur-md` ; barre d'onglets `bg-background/95 backdrop-blur-md` ; bouton flottant `bg-primary` |
| Bordure | en-tête `border-b border-border` ; barre d'onglets `border-t border-border` |
| Radius | liens de l'en-tête `rounded-md` ; bouton flottant `rounded-full` |
| Texte principal | lien actif `text-foreground` sur `bg-muted` (en-tête), `text-brand-strong` (onglets) ; bouton flottant `text-base font-semibold text-primary-foreground` |
| Texte secondaire | liens inactifs `text-muted-foreground`, onglets `text-xs font-medium` |
| Espacement | en-tête `h-16`, liens `min-h-11 px-3 gap-2` ; onglets `min-h-14 gap-1`, 4 colonnes égales ; bouton flottant `h-12 px-5 gap-2`, `right-6 bottom-6` |
| Hover / focus | `hover:text-foreground` ; bouton flottant `hover:bg-primary-hover` ; focus `outline-2 outline-ring` (onglets : décalage intérieur) |
| Ombre | bouton flottant `shadow-lg` |
| Accent | icône de la page active en vert (`text-brand-strong`) |

**Notes de pattern :** `aria-current="page"` sur l'entrée active (`isActive` : page ou sous-page). Barre d'onglets mobile seulement (`md:hidden`), la page réserve `pb-20` ; marge de la barre système en style en ligne (`env(safe-area-inset-bottom)`). Bouton flottant ordinateur seulement, masqué sur `/identifier`. Visiteur : l'onglet Compte devient « Connexion » avec retour à la page en cours.

### IdentifyLauncher (lanceur de la vitrine)

Fichier : `src/components/identify/identify-launcher.tsx`
Dernière mise à jour : 21 octobre 2026 (U38)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | carte `bg-card shadow-lg` (comme `IdentifyPanel`) ; champ `bg-transparent dark:bg-input/30` |
| Bordure | champ `border border-input`, focus `border-ring ring-3 ring-ring/50` |
| Radius | carte `rounded-xl`, champ et bouton `rounded-md` |
| Texte principal | saisie `text-base` ; bouton `text-base font-semibold` |
| Texte secondaire | raccourcis `text-sm font-medium text-muted-foreground`, « ou » et confidentialité `text-sm text-muted-foreground` |
| Espacement | carte `p-4 md:p-6 gap-4` ; champ et bouton `h-12` ; raccourcis `min-h-11 px-2 gap-2` |
| Hover / focus | bouton `hover:bg-primary-hover` ; raccourcis `hover:text-foreground` |
| Ombre | `shadow-lg` (carte du hero) |
| Accent | icônes des raccourcis et du cadenas `text-brand-strong` |

**Notes de pattern :** champ lien en vedette (icône à gauche), raccourcis en icône + texte dessous (« ou »), comme la référence ; l'identification se fait toujours dans l'application.

### Fonctionnalités illustrées : Features, MockWindow

Fichiers : `src/components/home/features.tsx`, `mock-window.tsx`
Dernière mise à jour : 22 octobre 2026 (U39)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | section `bg-card` ; fenêtre `bg-card` ; lignes de maquette `border border-border`, ligne finale `bg-brand-subtle` |
| Bordure | fenêtre `border border-border`, barre de titre `border-b border-border` |
| Radius | fenêtre `rounded-xl`, lignes `rounded-lg`, pastilles `rounded-sm`, points de fenêtre `rounded-full` |
| Texte principal | sur-titre `text-xs font-semibold uppercase tracking-widest text-brand-strong` ; titre `font-display text-display font-bold` en deux tons |
| Texte secondaire | description `text-base md:text-lg text-muted-foreground` ; barre de titre `text-xs text-muted-foreground` |
| Espacement | sections `gap-16 md:gap-24`, colonnes `md:grid-cols-2 gap-8 md:gap-16` ; fenêtre `p-4 md:p-5` |
| Hover / focus | none (maquettes non interactives, `aria-hidden`) |
| Ombre | fenêtre `shadow-lg` |
| Accent | points de fenêtre `bg-destructive`, `bg-warning`, `bg-success` ; barre de progression `bg-primary` |

**Notes de pattern :** texte et maquette alternent de côté (`md:order-*`) ; maquettes fidèles à nos écrans réels, sans affiche réelle ni logo de marque, avec une mention « Exemple d'affichage ». Étapes : pastille factuelle `rounded-full bg-brand-subtle text-brand-subtle-foreground` en bas de carte.

### TwoTone (grand titre en deux tons)

Fichier : `src/components/layout/two-tone.tsx`
Dernière mise à jour : 21 octobre 2026 (U37)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | none (s'insère dans un titre) |
| Bordure | none |
| Radius | none |
| Texte principal | celui du titre parent |
| Texte secondaire | mot clé `text-brand-strong` ; sur `bg-inverse` : `text-brand` |
| Espacement | none |
| Hover / focus | none |
| Ombre | none |
| Accent | mot clé en vert d'accent |

**Notes de pattern :** un seul mot clé par titre (champ `highlight` des textes de `src/content/fr/`) ; titre lu d'un seul tenant. Sur-titre associé : `text-xs font-semibold uppercase tracking-widest text-brand-strong`. Utilisé par `SectionHeading`, `Hero`, `FeaturedHero`, `FinalCta`.

### IdentifyTabs (mode d'identification)

Fichier : `src/components/identify/identify-tabs.tsx`
Dernière mise à jour : 21 octobre 2026 (U37 : onglet actif en accent plein `bg-primary font-semibold text-primary-foreground`, `whitespace-nowrap px-2`)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | conteneur `bg-muted` ; onglet choisi `bg-background` |
| Bordure | none |
| Radius | conteneur `rounded-lg`, onglets `rounded-md` |
| Texte principal | onglet choisi `text-sm font-medium text-foreground` |
| Texte secondaire | onglet non choisi `text-muted-foreground` |
| Espacement | conteneur `gap-1 p-1`, onglet `h-11 px-3`, largeur égale (`flex-1`) |
| Hover / focus | `hover:text-foreground` ; `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Ombre | none |
| Accent | none |

**Notes de pattern :** contrôle segmenté sans dépendance (pas de composant `ui` tabs) : `role="tablist"` + `role="tab"` (`aria-selected`, `aria-controls`, `tabIndex` 0 sur l'onglet choisi seulement), flèches gauche/droite, Début, Fin ; le panneau a `role="tabpanel"` et `aria-labelledby`. Le changement d'onglet laisse le focus sur l'onglet (modèle WAI-ARIA) ; Tab mène au contenu. U36 ajoutera « Lien » dans `IDENTIFY_TABS`.

### DescriptionForm (identification par description)

Fichier : `src/components/identify/description-form.tsx`
Dernière mise à jour : 20 octobre 2026 (U35)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | champ `bg-transparent` (`dark:bg-input/30`) |
| Bordure | champ `border border-input`, au focus `border-ring` + `ring-3 ring-ring/50` |
| Radius | champ `rounded-md`, bouton `rounded-md` (shadcn) |
| Texte principal | libellé `font-display text-2xl font-bold` (comme le titre de `ClipDropzone`) ; saisie `text-base` |
| Texte secondaire | aide et compteur `text-sm text-muted-foreground` ; indication `placeholder:text-muted-foreground` |
| Espacement | `gap-3` ; champ `px-3 py-2 min-h-28`, redimensionnable verticalement |
| Hover / focus | bouton `h-11 hover:bg-primary-hover`, désactivé hors 10 à 500 caractères |
| Ombre | none |
| Accent | none |

**Notes de pattern :** `<textarea>` natif aux classes du champ shadcn (pas de composant `ui` textarea), `maxLength` 500, décrit par l'aide et le compteur (`aria-describedby`, compteur non annoncé à chaque frappe). Bornes partagées avec le serveur (`src/schemas/describe.ts`). Les erreurs d'envoi s'affichent sous le formulaire (`role="alert"`), le texte reste dans le champ.

### LinkForm (identification par lien)

Fichier : `src/components/identify/link-form.tsx`
Dernière mise à jour : 20 octobre 2026 (U36)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | champ `bg-transparent` (`dark:bg-input/30`) |
| Bordure | champ `border border-input`, au focus `border-ring` + `ring-3 ring-ring/50`, invalide `aria-invalid:border-destructive` |
| Radius | champ `rounded-md`, bouton `rounded-md` (shadcn) |
| Texte principal | libellé `font-display text-2xl font-bold` ; saisie `text-base` |
| Texte secondaire | aide `text-sm text-muted-foreground` ; erreur `text-sm font-medium text-destructive` (`role="alert"`) |
| Espacement | `gap-3` ; champ `h-11 px-3` |
| Hover / focus | bouton `h-11 hover:bg-primary-hover`, désactivé tant que le lien n'est pas reconnu |
| Ombre | none |
| Accent | none |

**Notes de pattern :** même gabarit que `DescriptionForm` (libellé-titre, aide, champ, bouton aligné à droite dès `sm`). `type="url"`, `inputMode="url"`, `noValidate` : le contrôle est celui de `parseVideoLink` (partagé avec le serveur), affiché après la sortie du champ ou l'envoi, pas à chaque frappe. Erreurs serveur affichées par `IdentifyPanel` sous le formulaire, lien conservé dans le champ.

### ExcerptPicker (choix du passage d'une vidéo longue)

Fichier : `src/components/identify/excerpt-picker.tsx`
Dernière mise à jour : 20 octobre 2026 (U33)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | hérité de la carte `IdentifyPanel` (`bg-card`) ; aperçu vidéo `bg-muted` |
| Bordure | none |
| Radius | aperçu `rounded-lg` ; boutons shadcn `rounded-md` |
| Texte principal | titre `font-display text-xl font-bold` ; libellé `text-sm font-medium text-foreground` |
| Texte secondaire | `text-sm text-muted-foreground` (explication, « De 0:45 à 1:45 ») |
| Espacement | `gap-4` entre blocs, `gap-2` libellé-curseur, `gap-1` titre-explication, boutons `gap-3` |
| Hover / focus | bouton principal `hover:bg-primary-hover`, secondaire `variant="outline"` ; curseur natif, focus du navigateur |
| Ombre | none |
| Accent | curseur `accent-primary` |

**Notes de pattern :** affiché seulement pour une vidéo de plus de 60 s, avant tout envoi (aucune identification décomptée). Le focus passe au curseur à l'apparition (le bouton d'envoi vient de disparaître), décrit par l'explication et le passage. Pendant la lecture (`reading`, `preparing`, `extracting`), `IdentifyPanel` affiche un bouton `variant="outline"` « Annuler » (`h-11 w-full sm:w-fit`) qui ramène à la zone d'envoi, focus compris. Curseur `<input type="range">` natif (pas de composant `ui` slider) : `h-11` pour la zone tactile, `aria-valuetext` et texte visible « De … à … » (la position n'est pas donnée par la seule couleur). Aperçu `aspect-video object-contain`, seulement en lecture native. Mêmes boutons `h-11 w-full sm:w-fit` que la fin de parcours d'`IdentifyPanel`.

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

**Notes de pattern :** texte court (« 2 restantes ») jusqu'à `2xl`, complet au-delà (« 2 identifications restantes aujourd'hui ») : place libérée pour le compte dans l'en-tête (U04). Rechargé après une connexion ou une déconnexion (`reloadQuota`). Région `aria-live="polite"`. Alimenté par `useQuota()` (`GET /api/quota`, puis chaque réponse d'identification). Rien n'est affiché tant que le quota n'est pas connu (pas de saut de mise en page notable dans l'en-tête).

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

### WatchProviders (Où regarder)

Fichier : `src/components/title/watch-providers.tsx`
Dernière mise à jour : 16 octobre 2026 (U16)

| Propriété | Classe |
| --- | --- |
| Arrière-plan | service `bg-card` ; sélecteur `bg-card` |
| Bordure | service `border border-border` ; sélecteur (champ) `border border-input` |
| Radius | service et sélecteur `rounded-md` ; logo `rounded-sm` |
| Texte principal | nom du service `text-sm text-foreground` ; message « aucun service » `text-base text-foreground` |
| Texte secondaire | type d'accès, invitation, attribution `text-sm text-muted-foreground` |
| Espacement | bloc `gap-4`, groupe `gap-2`, services `gap-3`, service `px-2 py-1.5 gap-2` |
| Hover / focus | lien `text-primary hover:underline underline-offset-4` ; sélecteur et lien `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Ombre | none |
| Accent | icône `ExternalLink` `size-4` sur le lien |

**Notes de pattern :** premier bloc de la fiche. Chargé côté navigateur (pays du visiteur) : squelette pendant le chargement, `aria-live="polite"`. Sélecteur natif `<select>` `h-11` avec libellé « Pays » (noms de pays par `Intl.DisplayNames` en français). Logos TMDB w92 affichés en 28 px, non optimisés par Vercel. Mention « Disponibilités fournies par JustWatch. » toujours visible (invariant 12).

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

### FilmStripDecor (décor) — `PosterWall` retiré le 16 octobre 2026, remplacé par `CurvedFilmBand`

Fichiers : `src/components/decor/poster-wall.tsx`, `src/components/decor/film-strip-decor.tsx`

| Propriété | Classe |
| --- | --- |
| Arrière-plan | tuiles `bg-inverse-foreground/10` à `/20`, `bg-primary/40` à `/60`, `bg-brand/25` à `/40` ; voile `bg-linear-to-b from-inverse/35 via-inverse/70 to-inverse` |
| Bordure | `border border-inverse-foreground/10` |
| Radius | affiches `rounded-poster` ; images de pellicule `rounded-none` ; perforations `rounded-sm size-3 bg-inverse-foreground/25` |

**Notes de pattern :** toujours `aria-hidden`. Pas d'affiches réelles tant que la licence TMDB n'est pas obtenue (Q2). `Perforations` (exporté, prop `count`, `className`) est partagé avec `FilmStrip` (U06).

### Pages de compte : AuthCard, FormField, PasswordField, SubmitButton, FormMessage, GoogleButton

Fichiers : `src/components/auth/*.tsx` (U04)
Dernière mise à jour : 16 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | carte `bg-card` sur `bg-background` |
| Bordure | carte `border border-border` ; champs `border-input` (composant `Input`) |
| Radius | carte `rounded-lg` ; champs et messages `rounded-md` |
| Texte principal | titre `font-display text-display font-bold` ; libellés `text-sm font-medium text-foreground` |
| Texte secondaire | `text-sm text-muted-foreground` (aide, mention Google, bas de carte) |
| Espacement | colonne `max-w-md px-4 sm:px-6 py-10 md:py-16 gap-6` ; carte `p-4 md:p-6 gap-6` ; formulaire `gap-4` ; champ `gap-2` |
| Hover / focus | liens `text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring` ; case à cocher `size-5 accent-primary` + contour de focus |
| Ombre | none |
| Accent | bouton principal `h-11 w-full text-base hover:bg-primary-hover` ; Google `variant="outline" h-11 w-full gap-3` |

**Notes de pattern :** champs `h-11 rounded-md px-3 text-base` (16 px : pas de zoom iOS) ; erreur de champ `text-sm text-destructive` reliée par `aria-describedby` + `aria-invalid`. Message global : erreur `role="alert" border border-destructive bg-destructive/10 text-destructive`, confirmation `role="status" bg-brand-subtle text-brand-subtle-foreground`, avis après redirection (`AuthNotice`) `bg-muted border border-border`. Bouton afficher / masquer le mot de passe : `Button variant="ghost" size-11` posé dans le champ (`pr-12`), `aria-pressed`. Séparateur « ou » : deux traits `h-px bg-border`. Logo Google : fichier statique `public/brand/google-g.svg` (couleurs imposées par la charte Google, hors vocabulaire du projet).

### AccountMenu (en-tête)

Fichier : `src/components/layout/account-menu.tsx` (U04)
Dernière mise à jour : 16 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | pastille `bg-brand text-inverse` (17 octobre 2026 : `bg-inverse` était invisible sur le thème sombre) ; menu `bg-popover` (DropdownMenu shadcn) |
| Bordure | none |
| Radius | pastille `rounded-full` (cercle) ; menu `rounded-lg` (généré) |
| Texte principal | pastille `text-sm font-bold` (initiale) ; email `text-sm font-medium text-foreground truncate` |
| Texte secondaire | « Connecté en tant que » `text-sm text-muted-foreground` |
| Espacement | déclencheur `h-11 px-2` ; pastille `size-9` ; entrée `min-h-11 gap-2` ; menu `w-64` |
| Hover / focus | générés par shadcn (`focus:bg-accent`) |
| Ombre | menu `shadow-lg` (menus seulement, baseline) |
| Accent | visiteur : `Button variant="ghost" h-11 px-3 text-sm` « Se connecter » |

**Notes de pattern :** chargé côté navigateur (`useAccount`, `GET /api/account`) pour garder les pages statiques ; rien n'est affiché pendant le chargement. Déconnexion : formulaire HTML `POST /auth/deconnexion` (rechargement complet). Libellé accessible du déclencheur : « Compte de … ».

### LegalPage (textes provisoires)

Fichier : `src/components/legal/legal-page.tsx` (U04)
Dernière mise à jour : 16 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-background` ; avis de version `bg-muted` |
| Bordure | avis `border border-border` |
| Radius | avis `rounded-md` |
| Texte principal | titre `font-display text-display font-bold` ; liste `text-base text-foreground list-disc pl-5 gap-3` |
| Espacement | colonne `max-w-2xl px-4 sm:px-6 py-10 md:py-16 gap-6` |
| Ombre | none |

**Notes de pattern :** même colonne que l'écran de bienvenue (`/bienvenue` : liste à coches `text-brand-strong` dans une carte `rounded-lg border border-border bg-card p-4 md:p-6`).

### CurvedFilmBand (fond du hero)

Fichier : `src/components/decor/curved-film-band.tsx` (16 octobre 2026, adapté du composant « TiltedGridHero » fourni par le fondateur)
Dernière mise à jour : 16 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | bandes `bg-inverse-foreground/10` (avant chargement des images) |
| Bordure | none |
| Radius | extrémités des tuiles `rounded-l-lg` / `rounded-r-lg` |
| Texte | none (décoratif, `aria-hidden`) |
| Espacement | calculé (tuiles en unités `cqh` / `cqw`, styles en ligne) |
| Ombre | none |
| Accent | photos d'ambiance, fondu aux extrémités (masque) |

**Notes de pattern :** pas dans `src/components/ui/` (réservé aux composants générés par la CLI shadcn). Monté après `load` + temps calme du navigateur, jamais si `saveData` ; en pause si `prefers-reduced-motion` **ou** si un élément porte `data-pause-motion` (`IdentifyPanel` pendant l'analyse : l'animation 3D ralentissait l'extraction des images au point de faire échouer les tests). Images : `public/hero/*.webp` (640 × 360, ≈ 30 Ko chacune, 300 Ko au total), photos Unsplash (licence Unsplash) : 1478720568477-152d9b164e26, 1513106580091-1d82408b8cd6, 1485846234645-a62644f84728, 1489599849927-2ee91cede3ba, 1440404653325-ab127d49abc1, 1585647347384-2593bc35786b, 1524985069026-dd778a71c7b4, 1536440136628-849c177e76a1, 1574267432553-4b4628081c31, 1595769816263-9b910be24d5f. Écartées : marques (Netflix, Hollywood, Moulin Rouge), affiches réelles, personnage protégé. Masque en `black` (seule l'opacité compte). Sur mobile, le bandeau est surtout visible entre le texte et la carte d'envoi.

### ResultDialog (résultat d'identification)

Fichier : `src/components/identify/result-dialog.tsx` (16 octobre 2026, demande du fondateur)
Dernière mise à jour : 16 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | `bg-popover` (Dialog / Sheet shadcn), fond assombri et flouté (généré) |
| Bordure | séparateur des actions `border-t border-border` |
| Radius | Dialog `rounded-xl` (généré) ; Sheet `rounded-t-xl` |
| Texte principal | titre `font-display text-xl font-bold text-foreground` |
| Texte secondaire | quota restant `text-sm text-muted-foreground` (description accessible) |
| Espacement | Dialog `p-6 gap-4 sm:max-w-xl` ; Sheet `p-4 gap-4` ; `max-h-[90dvh] overflow-y-auto` |
| Hover / focus | bouton fermer `Button variant="ghost" size-11` avec `aria-label` français (bouton généré « Close » masqué) |
| Ombre | `shadow-lg` (modale, baseline) |
| Accent | « Choisir un autre clip » `variant="outline" h-11` ; « Voir la fiche » dans la carte |

**Notes de pattern :** Dialog centré à partir de `md` (768 px), Sheet `side="bottom"` en dessous (`useSyncExternalStore` sur `matchMedia`). S'ouvre à chaque nouveau résultat ; fermé, il se rouvre par « Voir le résultat » dans le panneau. Les échecs (quota, pause IA, images inexploitables) restent affichés dans le panneau, sans fenêtre.

### Accueil animé : FeaturedHero, PosterRow, PosterCard, GenreExplorer, StarRating, Reveal

Fichiers : `src/components/showcase/*.tsx` (16 octobre 2026, AD-35, AD-36)
Dernière mise à jour : 17 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | vedette `bg-inverse` + image large TMDB, voiles `bg-linear-to-t from-background via-inverse/70 to-inverse/30` et (md) `bg-linear-to-r from-inverse via-inverse/60 to-transparent` ; affiche `bg-muted` avant chargement ; tuile de genre : image + voile `bg-inverse/70` (`/40` si choisie) |
| Bordure | affiche `ring-1 ring-border`, survol `ring-2 ring-link` ; tuile de genre `ring-1 ring-border`, choisie `ring-2 ring-link` ; étiquette de type `border border-inverse-foreground/30` |
| Radius | affiches et tuiles `rounded-lg` ; boutons ronds `rounded-full` ; étiquette `rounded-sm` |
| Texte principal | titre vedette `font-display text-display-lg md:text-display-xl font-extrabold` ; titres de rangée `font-display text-display font-bold` ; titre d'affiche `text-sm font-semibold truncate` |
| Texte secondaire | `text-sm text-muted-foreground` (année, notes) ; sur la vedette `text-inverse-muted` ; sur-titre `text-sm font-semibold uppercase tracking-wide` |
| Espacement | rangées `gap-4`, affiches `w-32 md:w-40` ; entre rangées `gap-12 md:gap-16` ; vedette `pt-8 pb-12 md:pt-16 md:pb-20`, `md:min-h-[38rem]` |
| Hover / focus | affiche : `whileHover` y −8 px, échelle 1,04 (ressort), image `group-hover:scale-105` ; focus `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring` ; boutons ronds `Button variant="outline" size-11 rounded-full` |
| Ombre | affiches `shadow-lg` (exception assumée : profondeur des rangées, maquette du fondateur) |
| Accent | étoiles `fill-current text-warning` (vides `text-muted-foreground`), valeur en `sr-only` ; point actif de la vedette `bg-inverse-foreground` (largeur animée 8 → 28 px) |

**Notes de pattern :** composants `m.*` uniquement (LazyMotion strict). Rangées : Embla `dragFree`, flèches à partir de `md`, apparition en cascade (`staggerChildren` 0,06 s). Vedette : Embla `Fade` + `Autoplay` (7 s, pause au survol, bouton pause, coupée si `prefers-reduced-motion` ou pendant l'analyse d'un clip), images montées au fur et à mesure (la première en `priority`), zoom lent `animate-ken-burns`, contrôles en `flex-wrap` (8 cibles de 44 px ne tiennent pas sur un téléphone). Zone d'envoi : `order-1` sur mobile (premier écran), à droite sur ordinateur, avec le `h1` « Quel est ce film ? ». Mention « Titres, affiches et notes fournis par TMDB » sous les rangées.

### HistoryList (historique)

Fichier : `src/components/history/history-list.tsx`, page `src/app/historique/page.tsx` (U17)
Dernière mise à jour : 17 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | ligne `bg-card`, survol `hover:bg-accent` ; état vide : carte `bg-card` |
| Bordure | `border border-border` |
| Radius | `rounded-lg` ; affiche `rounded-poster` (TitlePoster w92, 56 px) |
| Texte principal | titre `font-display text-lg font-bold text-foreground`, survol `group-hover:text-link`, tronqué |
| Texte secondaire | type, année, date `text-sm text-muted-foreground` |
| Espacement | liste `gap-3` ; ligne `p-3 md:p-4 gap-4` ; colonne de page `max-w-2xl px-4 sm:px-6 py-10 md:py-16 gap-6` |
| Hover / focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Ombre | none |
| Accent | `ConfidenceBadge` (sous la date sur mobile, à droite à partir de `sm`) |

**Notes de pattern :** chaque ligne est un lien vers la fiche (titre inconnu : slug « titre », corrigé par la redirection 308 de la fiche). Lignes en cascade (`staggerChildren` 0,04 s, glissement depuis la gauche). Date déjà formatée côté serveur en heure de Paris (`formatParisDateTime`). Titre indisponible : « Titre indisponible » avec l'affiche de remplacement.

### WatchlistButton et WatchlistGrid (liste de suivi)

Fichiers : `src/components/watchlist/watchlist-button.tsx`, `src/components/watchlist/watchlist-grid.tsx`, page `src/app/ma-liste/page.tsx` (U18)
Dernière mise à jour : 19 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | bouton `Button variant="outline"` ; sur l'en-tête de fiche (`tone="inverse"`) `bg-transparent` ; grille : affiche `bg-muted` avant chargement |
| Bordure | dans la liste : `border-brand-strong text-brand-strong` ; affiche `ring-1 ring-border`, survol `ring-2 ring-link` ; sur fond sombre `border-inverse-foreground/40` |
| Radius | bouton `rounded-lg` (preset) ; affiche `rounded-lg` |
| Texte principal | bouton `text-base` ; titre sous l'affiche `text-sm font-semibold truncate` |
| Texte secondaire | année, compteur « n / 100 titres » `text-sm text-muted-foreground` |
| Espacement | bouton `h-11 gap-2 px-4` ; grille `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4` ; colonne de page `max-w-4xl` |
| Hover / focus | focus `focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring` |
| Ombre | none |
| Accent | icône Plus ↔ Check avec rotation et ressort (Motion) |

**Notes de pattern :** état « dans ma liste » porté par `aria-pressed`, nom accessible = texte visible (WCAG 2.5.3). Optimiste : désactivé tant que l'état partagé n'est pas chargé et pendant la requête ; refus → retour en arrière et `toast.error` (texte de `WATCHLIST_TEXT.failures`). Visiteur : lien vers `/connexion?suite=<page>`. Requêtes `keepalive` (aboutissent même si l'on quitte la page). Grille : retrait animé (`AnimatePresence` + `layout`), bouton « Retirer » sous chaque affiche avec le titre en `sr-only`, état vide avec renvoi vers l'envoi d'un clip.

### Mon compte : AvatarEditor, NameForm

Fichiers : `src/components/account/avatar-editor.tsx`, `src/components/account/name-form.tsx`, page `src/app/compte/page.tsx` (U05)
Dernière mise à jour : 20 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | sections `bg-card` ; pastille sans photo `bg-brand` (initiale `text-inverse font-display`) |
| Bordure | sections `border border-border` ; photo `ring-2 ring-border` ; séparateur email `border-t border-border` |
| Radius | sections `rounded-lg` ; photo `rounded-full` |
| Texte principal | titres de section `text-lg font-semibold text-foreground` |
| Texte secondaire | aide, date d'inscription `text-sm text-muted-foreground` |
| Espacement | colonne `max-w-2xl` ; sections `p-4 md:p-6 gap-4` ; photo `size-24` |
| Hover / focus | boutons shadcn (`outline` pour changer, `ghost` pour retirer), `h-11` |
| Ombre | none |
| Accent | photo en fondu à chaque changement (Motion) ; confirmations par `toast` |

**Notes de pattern :** champ de fichier masqué (`sr-only`, hors tabulation) déclenché par le bouton « Choisir / Changer la photo » ; taille vérifiée dans le navigateur avant l'envoi (4 Mo). La même photo (lien signé 1 h) s'affiche dans l'en-tête (`AccountBadge`, `size-9 rounded-full object-cover`). Le formulaire du nom réutilise `FormField`, `FormMessage`, `SubmitButton` des pages de compte.

### ShareButton et carte d'aperçu (partage)

Fichiers : `src/components/share/share-button.tsx`, `src/server/share/title-card.tsx`, `src/app/titre/[kind]/[idSlug]/opengraph-image.tsx` (U19)
Dernière mise à jour : 20 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | bouton `Button variant="outline"` ; sur l'en-tête de fiche `bg-transparent` (`tone="inverse"`) |
| Bordure | sur fond sombre `border-inverse-foreground/40` |
| Radius | bouton `rounded-lg` (preset) |
| Texte principal | `text-base`, icône `Share2` `size-5` |
| Espacement | `h-11 gap-2 px-4` ; à côté de « Ajouter à ma liste » (`flex flex-wrap gap-2`) |
| Ombre | none (carte d'aperçu : ombre de l'affiche, rendue par l'image) |
| Accent | confirmation « Lien copié » par `toast.success` |

**Notes de pattern :** carte d'aperçu 1200 × 630 : image large TMDB sous un voile (dégradé `inverse` → transparent), affiche 300 × 450 arrondie, marque, titre Archivo 800 (76 px, 60 px au-delà de 30 caractères), méta en vert `brandStrong`, synopsis coupé à 150 caractères, pied « Identifié avec SHAZAM SERIE · Données TMDB ». Couleurs : `src/server/share/og-palette.ts` (copie des jetons, à tenir à jour).

### ReportForm (signalement d'erreur)

Fichier : `src/components/identify/report-form.tsx` (dans `ResultDialog`, U20)
Dernière mise à jour : 20 octobre 2026

| Propriété | Classe |
| --- | --- |
| Arrière-plan | résultats de recherche `bg-card`, survol `hover:bg-accent` |
| Bordure | résultat `border border-border`, choisi `border-brand-strong` ; champ `Input` (`border-input`) |
| Radius | champ et résultats `rounded-md` |
| Texte principal | titre `font-display text-xl font-bold` ; libellés `text-sm font-medium text-foreground` |
| Texte secondaire | aide, états de recherche `text-sm text-muted-foreground` |
| Espacement | formulaire `gap-4` ; résultat `p-2 gap-3` ; liste `max-h-64 overflow-y-auto` |
| Hover / focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| Ombre | none |
| Accent | coche `text-brand-strong` sur le titre choisi |

**Notes de pattern :** lien d'entrée discret sous le résultat (`text-sm text-muted-foreground underline`, `min-h-11`). Résultat choisi porté par `aria-pressed` ; recherche après 350 ms, annonces dans une région `aria-live`. Case de consentement non cochée par défaut avec son explication (`aria-describedby`), affichée seulement si des images sont encore en mémoire. Confirmation par `toast.success`, puis retour au résultat sans le lien (un seul signalement).
