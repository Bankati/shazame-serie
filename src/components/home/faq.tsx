import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HOME_TEXT } from "@/content/fr/home";

import { SectionHeading } from "./section-heading";

export function Faq() {
  const { faq } = HOME_TEXT;

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <SectionHeading id="faq-title" eyebrow={faq.eyebrow} title={faq.title} align="start" />
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4 md:col-span-2 md:px-6">
          {faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-border">
              <AccordionTrigger className="min-h-11 items-center py-4 text-base font-semibold">{item.question}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
