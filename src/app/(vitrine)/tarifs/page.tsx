import { Check, Minus, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { TwoTone } from "@/components/layout/two-tone";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HOME_TEXT } from "@/content/fr/home";
import { PRICING_TEXT } from "@/content/fr/pricing";

export const metadata: Metadata = { title: PRICING_TEXT.metaTitle, description: PRICING_TEXT.metaDescription };

// Page des tarifs (U21, CDC 12.8) : les deux offres, la comparaison avec l'usage sans compte et les questions
// sur le décompte et la résiliation. Statique. Le Premium reste « bientôt disponible » jusqu'au paiement (U22, D1).
export default function PricingPage() {
  const text = PRICING_TEXT;
  const { comparison } = text;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-display-lg font-extrabold md:text-display-xl">
          <TwoTone text={text.title} highlight={text.highlight} />
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">{text.subtitle}</p>
      </div>

      <PricingPlans headingLevel="h2" />

      <p className="flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        {HOME_TEXT.pricing.reassurance}
      </p>

      <section aria-labelledby="comparison-title" className="flex flex-col gap-4">
        <h2 id="comparison-title" className="font-display text-xl font-bold md:text-2xl">
          {comparison.title}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-lg text-left text-sm md:text-base">
            <caption className="sr-only">{comparison.caption}</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-4 font-semibold">
                  {comparison.feature}
                </th>
                {comparison.columns.map((column) => (
                  <th key={column} scope="col" className="p-4 text-center font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <th scope="row" className="p-4 font-medium">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={comparison.columns[index]} className="p-4 text-center">
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="pricing-faq-title" className="flex flex-col gap-4">
        <h2 id="pricing-faq-title" className="font-display text-xl font-bold md:text-2xl">
          {text.faq.title}
        </h2>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4 md:px-6">
          {text.faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`tarifs-${index}`} className="border-border">
              <AccordionTrigger className="min-h-11 items-center py-4 text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

/** Case du tableau : texte, ou coche / tiret avec un libellé pour les lecteurs d'écran. */
function Cell({ value }: { value: string | boolean }) {
  const { yes, no } = PRICING_TEXT.comparison;
  if (typeof value === "string") {
    return <span className="font-medium">{value}</span>;
  }
  return value ? (
    <span className="inline-flex">
      <Check className="size-5 text-brand-strong" aria-hidden="true" />
      <span className="sr-only">{yes}</span>
    </span>
  ) : (
    <span className="inline-flex">
      <Minus className="size-5 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{no}</span>
    </span>
  );
}
