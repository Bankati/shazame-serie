// Montants en centimes (entiers, code-standards.md) → texte en français : « 2,99 € ».
export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(
    amountCents / 100,
  );
}
