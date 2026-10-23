import { Check } from "lucide-react";
import Link from "next/link";

import { IDENTIFY_PATH } from "@/components/layout/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOME_TEXT } from "@/content/fr/home";
import { PRICING_TEXT } from "@/content/fr/pricing";
import { cn } from "@/lib/utils";

/**
 * Paiement Premium ouvert (U22). Tant que le prestataire n'est pas choisi (D1), le bouton reste désactivé et
 * annonce « Bientôt disponible » ; aucune page ne simule un paiement.
 */
export const PREMIUM_CHECKOUT_OPEN = false;

type Plan = {
  name: string;
  price: string;
  yearly?: string;
  badge?: string;
  features: readonly string[];
  highlighted?: boolean;
};

// Les deux offres (U21) : utilisées par l'aperçu de la vitrine et par la page /tarifs. Gratuit : on commence tout
// de suite ; Premium : désactivé jusqu'à l'ouverture du paiement.
export function PricingPlans({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const { pricing } = HOME_TEXT;
  const plans: Plan[] = [{ ...pricing.free }, { ...pricing.premium, highlighted: true }];
  const Heading = headingLevel;

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <li
          key={plan.name}
          className={cn(
            "flex flex-col gap-6 rounded-xl bg-background p-6 md:p-8",
            plan.highlighted ? "border-2 border-primary" : "border border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Heading className="text-xl font-semibold">{plan.name}</Heading>
            {plan.badge ? <Badge className="h-6 px-2.5 text-sm">{plan.badge}</Badge> : null}
          </div>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-display-lg font-extrabold">{plan.price}</span>
            <span className="text-muted-foreground">{pricing.perMonth}</span>
            {plan.yearly ? <span className="w-full text-sm text-muted-foreground">{plan.yearly}</span> : null}
          </p>
          <ul className="flex flex-col gap-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {plan.highlighted ? (
            <div className="mt-auto flex flex-col gap-2">
              <Button disabled={!PREMIUM_CHECKOUT_OPEN} className="h-11 w-full text-base">
                {PRICING_TEXT.premiumSoon}
              </Button>
              <p className="text-center text-sm text-muted-foreground">{PRICING_TEXT.premiumSoonNote}</p>
            </div>
          ) : (
            <Button asChild variant="outline" className="mt-auto h-11 w-full text-base">
              <Link href={IDENTIFY_PATH}>{PRICING_TEXT.freeCta}</Link>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
