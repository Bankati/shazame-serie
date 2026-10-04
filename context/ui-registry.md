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
| Bouton principal | `<Button>` (variante `default`) : `bg-primary text-primary-foreground hover:bg-primary-hover rounded-md` |
| Bouton secondaire | `<Button variant="outline">` : `border-input bg-card hover:bg-accent` |
| Lien | `text-primary underline-offset-4 hover:underline` |
| Champ de saisie | `<Input>` : `border-input rounded-md` |
| Texte secondaire | `text-sm text-muted-foreground` |
| Titre de film | `font-display text-display md:text-display-lg font-bold` |
| Affiche | `rounded-poster aspect-[2/3]` |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (fourni par shadcn) |
| Ombre | aucune (sauf menus et modales : `shadow-lg`) |
| Surface inversée (pellicule) | `bg-inverse text-inverse-foreground rounded-none` |
| Badge « Très probable » | `bg-brand-subtle text-brand-subtle-foreground rounded-sm` |
| Badge « Probable » | `text-warning` + icône, fond `bg-muted` |
| Erreur de champ | `text-sm text-destructive` |

Note : `aspect-[2/3]` est une valeur arbitraire de **proportion**, autorisée. L'interdiction des valeurs arbitraires concerne les couleurs, rayons, tailles de texte et espacements.

## Composants

_Aucun composant enregistré. Le premier `/imprint` ajoutera ses entrées ici._
