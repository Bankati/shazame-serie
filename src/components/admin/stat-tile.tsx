// Chiffre clé du tableau de bord (U25) : libellé, valeur, précision. Pas de couleur : les chiffres seuls.
// À placer dans un <dl>.
export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl font-bold text-card-foreground tabular-nums">{value}</dd>
      {hint ? <dd className="text-sm text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}
