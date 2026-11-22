// Montants en centimes (entiers, code-standards.md) → texte en français : « 2,99 € ».
export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(
    amountCents / 100,
  );
}

const MICRO_EUR_SMALL = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 4 });
const MICRO_EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// Coûts IA en micro-euros (architecture.md) → texte : 4 décimales sous 1 € (un appel coûte quelques millièmes),
// 2 au-delà.
export function formatMicroEur(amountMicroEur: number): string {
  const euros = amountMicroEur / 1_000_000;
  return (Math.abs(euros) < 1 ? MICRO_EUR_SMALL : MICRO_EUR).format(euros);
}
