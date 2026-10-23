"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CircleCheck } from "lucide-react";
import { useRef } from "react";

import { HOME_TEXT } from "@/content/fr/home";

import { DEMO_FALLBACK, DemoPhone, type DemoTitle } from "./demo-phone";
import { addDemoSequence } from "./demo-timeline";
import { SectionHeading } from "./section-heading";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Étape mise en avant à chaque moment de la démonstration (étiquettes de demo-timeline.ts).
const STEP_LABELS = [["clip"], ["extract", "analyse"], ["result"]] as const;

// Comment ça marche (U43, AD-48) : une carte violette où les trois étapes s'allument tour à tour pendant que le
// téléphone rejoue l'identification. Sur ordinateur, la section reste épinglée environ un écran et demi et
// l'animation suit le défilement ; sur mobile, la démonstration tourne en boucle quand la carte est visible.
// « Moins d'animations » : aucune animation, toutes les étapes lisibles et le résultat affiché.
export function HowItWorks({ demoTitle = DEMO_FALLBACK }: { demoTitle?: DemoTitle }) {
  const { howItWorks } = HOME_TEXT;
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".how-stage",
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });
        timeline.fromTo(".how-card", { scale: 0.9, y: 60 }, { scale: 1, y: 0, duration: 1, ease: "power2.out" });
        timeline.set(".how-step", { opacity: 0.45 });
        addDemoSequence(timeline, { hold: 0.6 });
        STEP_LABELS.forEach((labels, index) => {
          labels.forEach((label) => {
            timeline.to(".how-step", { opacity: 0.45, duration: 0.2 }, label);
            timeline.to(`.how-step-${index}`, { opacity: 1, duration: 0.2 }, label);
          });
        });
      });
      media.add("(prefers-reduced-motion: no-preference) and (max-width: 1023px)", () => {
        const loop = addDemoSequence(gsap.timeline({ repeat: -1, paused: true })).seek("result");
        ScrollTrigger.create({
          trigger: ".how-card",
          start: "top 80%",
          end: "bottom 20%",
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        });
      });
    },
    { scope },
  );

  return (
    <section ref={scope} id="comment-ca-marche" aria-labelledby="how-title" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
        <SectionHeading
          id="how-title"
          eyebrow={howItWorks.eyebrow}
          title={howItWorks.title}
          highlight={howItWorks.highlight}
          subtitle={howItWorks.subtitle}
        />
      </div>
      <div className="how-stage flex items-center px-4 py-6 sm:px-6 lg:min-h-dvh">
        <div className="how-card mx-auto grid w-full max-w-6xl items-center gap-10 overflow-hidden rounded-3xl bg-inverse p-6 text-inverse-foreground md:p-12 lg:grid-cols-2">
          <ol className="flex flex-col gap-6">
            {howItWorks.steps.map((step, index) => (
              <li key={step.title} className={`how-step how-step-${index} flex gap-4`}>
                <span className="font-display text-display font-extrabold text-brand-light" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-inverse-muted">{step.description}</p>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-inverse-foreground/10 px-3 py-1 text-sm font-medium">
                    <CircleCheck className="size-4 text-brand-light" aria-hidden="true" />
                    {step.chip}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex justify-center">
            <DemoPhone title={demoTitle} />
          </div>
        </div>
      </div>
    </section>
  );
}
