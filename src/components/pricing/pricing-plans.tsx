import { Check } from "lucide-react";
import Link from "next/link";

import { IDENTIFY_PATH } from "@/components/layout/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOME_TEXT } from "@/content/fr/home";
import { PRICING_TEXT } from "@/content/fr/pricing";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  yearly?: string;
  badge?: string;
  features: readonly string[];
  highlighted?: boolean;
};

// Les deux offres (U21) : utilisées par l'aperçu de la vitrine et par la page /tarifs. Gratuit : on commence tout
// de suite. Premium (U22) : `checkout` est la Server Action de paiement, fournie seulement quand Stripe est
// configuré ; sans elle, le bouton reste désactivé (« Bientôt disponible ») et rien ne simule un paiement.
export function PricingPlans({
  headingLevel = "h3",
  checkout,
}: {
  headingLevel?: "h2" | "h3";
  checkout?: (form: FormData) => Promise<never>;
}) {
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
            checkout ? (
              // Un seul formulaire, deux boutons : le bouton choisi envoie la formule (mensuelle ou annuelle).
              <form action={checkout} className="mt-auto flex flex-col gap-2">
                <Button type="submit" name="plan" value="monthly" className="h-11 w-full text-base hover:bg-primary-hover">
                  {PRICING_TEXT.subscribeMonthly}
                </Button>
                <Button type="submit" name="plan" value="yearly" variant="outline" className="h-11 w-full text-base">
                  {PRICING_TEXT.subscribeYearly}
                </Button>
                <p className="text-center text-sm text-muted-foreground">{PRICING_TEXT.checkoutNote}</p>
              </form>
            ) : (
              <div className="mt-auto flex flex-col gap-2">
                <Button disabled className="h-11 w-full text-base">
                  {PRICING_TEXT.premiumSoon}
                </Button>
                <p className="text-center text-sm text-muted-foreground">{PRICING_TEXT.premiumSoonNote}</p>
              </div>
            )
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
