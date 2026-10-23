import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PricingPlans } from "@/components/pricing/pricing-plans";
import { HOME_TEXT } from "@/content/fr/home";
import { PRICING_TEXT } from "@/content/fr/pricing";

import { SectionHeading } from "./section-heading";

// Aperçu des tarifs sur la vitrine (U39) ; le détail et la comparaison sont sur /tarifs (U21).
export function PricingTeaser() {
  const { pricing } = HOME_TEXT;

  return (
    <section id="tarifs" aria-labelledby="pricing-title" className="scroll-mt-16 bg-card px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <SectionHeading id="pricing-title" eyebrow={pricing.eyebrow} title={pricing.title} highlight={pricing.highlight} subtitle={pricing.subtitle} />
        <PricingPlans />
        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          {/* Réassurance (U39) : seulement ce qui est vrai aujourd'hui (paiement pas encore ouvert, D1). */}
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
            {pricing.reassurance}
          </p>
          <p>{pricing.free.footnote}</p>
          <Link
            href="/tarifs"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-base font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {PRICING_TEXT.compareLink}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
