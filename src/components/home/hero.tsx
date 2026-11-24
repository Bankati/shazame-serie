"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Lock, ScanSearch, Sparkles, Tv } from "lucide-react";
import { useRef } from "react";

import { IdentifyLauncher } from "@/components/identify/identify-launcher";
import { TwoTone } from "@/components/layout/two-tone";
import { HOME_TEXT } from "@/content/fr/home";
import { cn } from "@/lib/utils";

import { DEMO_FALLBACK, DemoPhone, type DemoTitle } from "./demo-phone";
import { addDemoSequence } from "./demo-timeline";

gsap.registerPlugin(useGSAP);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)";

// Premier écran (U43, AD-48) : à gauche la promesse et le lanceur d'identification (visible sans défiler sur
// mobile), à droite un téléphone qui rejoue une identification en boucle, entouré de trois pastilles. Le
// téléphone s'incline vers la souris sur ordinateur (pastilles visibles sur grand écran seulement). « Moins d'animations » : tout reste immobile, résultat affiché.
export function Hero({ demoTitle = DEMO_FALLBACK }: { demoTitle?: DemoTitle }) {
  const { hero, demo } = HOME_TEXT;
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        gsap.from(".hero-reveal", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" });
        gsap.from(".hero-device", { y: 80, rotation: 6, autoAlpha: 0, duration: 1.2, ease: "expo.out", delay: 0.2 });
        gsap.from(".hero-badge", {
          scale: 0.6,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "back.out(1.7)",
          delay: 0.7,
        });
        gsap.to(".hero-badge", {
          y: -8,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: 0.4,
          delay: 1.5,
        });
        // La boucle part du résultat, déjà affiché par le serveur : aucun saut au chargement.
        addDemoSequence(gsap.timeline({ repeat: -1, delay: 1.2 })).seek("result");
      });
      media.add(FINE_POINTER, () => {
        const rotateY = gsap.quickTo(".hero-tilt", "rotationY", { duration: 1, ease: "power3.out" });
        const rotateX = gsap.quickTo(".hero-tilt", "rotationX", { duration: 1, ease: "power3.out" });
        const onMove = (event: PointerEvent) => {
          rotateY((event.clientX / window.innerWidth - 0.5) * 16);
          rotateX(-(event.clientY / window.innerHeight - 0.5) * 12);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope },
  );

  // Pastilles sur grand écran seulement : sur mobile, elles masqueraient l'écran du téléphone.
  const badge =
    "hero-badge absolute z-10 hidden items-center gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-md lg:flex";

  return (
    <section ref={scope} id="identifier" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-hidden">
      {/* Halos de couleur de la marque, décoratifs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute -top-32 -right-24 size-96 rounded-full bg-inverse/15 blur-3xl" />
        <span className="absolute top-1/2 -left-32 size-80 rounded-full bg-brand/10 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-6 md:pt-16 lg:grid-cols-2 lg:gap-8 lg:pb-24">
        <div className="flex min-w-0 flex-col gap-5">
          <p className="hero-reveal inline-flex w-fit items-center gap-2 rounded-full bg-brand-subtle px-3 py-1 text-sm font-medium text-brand-subtle-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="hero-reveal font-display text-display-lg font-extrabold md:text-display-xl">
            <TwoTone text={hero.title} highlight={hero.highlight} />
          </h1>
          <p className="hero-reveal max-w-prose text-base text-muted-foreground md:text-lg">{hero.subtitle}</p>
          <div className="hero-reveal">
            <IdentifyLauncher />
          </div>
        </div>

        <div className="relative flex justify-center py-6 perspective-distant">
          <div className="hero-device hero-tilt relative">
            <DemoPhone title={demoTitle} />
            <Badge className={cn(badge, "top-0 -left-44")} icon={Lock} {...demo.badges.privacy} />
            <Badge className={cn(badge, "top-1/2 -right-48")} icon={ScanSearch} {...demo.badges.modes} />
            <Badge className={cn(badge, "bottom-8 -left-40")} icon={Tv} {...demo.badges.sheet} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({
  className,
  icon: Icon,
  title,
  text,
}: {
  className: string;
  icon: typeof Lock;
  title: string;
  text: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle">
        <Icon className="size-5 text-brand-strong" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}
