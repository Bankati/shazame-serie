import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOME_TEXT } from "@/content/fr/home";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";

type Plan = {
  name: string;
  price: string;
  yearly?: string;
  badge?: string;
  features: readonly string[];
  highlighted?: boolean;
};

// Aperçu des tarifs. La page /tarifs et le paiement arrivent avec leurs unités : boutons désactivés.
export function PricingTeaser() {
  const { pricing } = HOME_TEXT;
  const plans: Plan[] = [{ ...pricing.free }, { ...pricing.premium, highlighted: true }];

  return (
    <section id="tarifs" aria-labelledby="pricing-title" className="scroll-mt-16 bg-card px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <SectionHeading id="pricing-title" eyebrow={pricing.eyebrow} title={pricing.title} subtitle={pricing.subtitle} />
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
                <h3 className="text-xl font-semibold">{plan.name}</h3>
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
              <Button disabled variant={plan.highlighted ? "default" : "outline"} className="mt-auto h-11 w-full text-base">
                {pricing.comingSoon}
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-center text-sm text-muted-foreground">{pricing.free.footnote}</p>
      </div>
    </section>
  );
}
