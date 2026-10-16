import { Faq } from "@/components/home/faq";
import { Features } from "@/components/home/features";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Privacy } from "@/components/home/privacy";

// Accueil statique (U02) : l'identification réelle arrive avec ClipDropzone (U06) et le pipeline (U09).
export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Privacy />
      <PricingTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
