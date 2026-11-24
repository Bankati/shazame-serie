import { gsap } from "gsap";

// Séquence du téléphone de démonstration (U43) : extrait → images extraites → analyse → résultat. Les sélecteurs
// visent les classes `demo-*` de DemoPhone ; ils sont limités au composant appelant par le contexte GSAP
// (useGSAP + scope). Les étiquettes `clip`, `extract`, `analyse` et `result` servent à la section des étapes.

export const DEMO_LABELS = ["clip", "extract", "analyse", "result"] as const;

function screen(step: number): string {
  return `[data-demo-step="${step}"]`;
}

/** Ajoute la séquence complète à `timeline` ; `hold` allonge les pauses (boucle du hero). */
export function addDemoSequence(
  timeline: gsap.core.Timeline,
  { hold = 1 }: { hold?: number } = {},
): gsap.core.Timeline {
  const out = { autoAlpha: 0, y: -16, duration: 0.35, ease: "power2.in" };
  const into = { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" };

  timeline
    .set(".demo-screen", { autoAlpha: 0, y: 16 })
    .set(".demo-progress", { scaleX: 0 })
    .set(".demo-ring", { strokeDashoffset: 100 })
    .set(".demo-scan", { left: "0%" })
    .addLabel("clip")
    .to(screen(0), into)
    .to(".demo-progress", { scaleX: 1, duration: 1.4 * hold, ease: "none" })
    .to(".demo-cta", { scale: 0.94, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" })
    .to(screen(0), out)
    .addLabel("extract")
    .to(screen(1), into, "<")
    .from(".demo-thumb", { y: 24, scale: 0.8, autoAlpha: 0, duration: 0.4, stagger: 0.15, ease: "back.out(1.6)" }, "<")
    .from(`${screen(1)} .demo-check`, { x: -12, autoAlpha: 0, duration: 0.3, stagger: 0.2 }, "-=0.2")
    .to({}, { duration: 0.6 * hold })
    .to(screen(1), out)
    .addLabel("analyse")
    .to(screen(2), into, "<")
    .to(".demo-scan", { left: "100%", duration: 0.7 * hold, repeat: 1, yoyo: true, ease: "sine.inOut" })
    .to(".demo-ring", { strokeDashoffset: 0, duration: 1.4 * hold, ease: "power2.inOut" }, "<")
    .to(screen(2), out)
    .addLabel("result")
    .to(screen(3), into, "<")
    .from(".demo-result-item", { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.12, ease: "power3.out" }, "<")
    .from(".demo-confidence", { scale: 0.6, duration: 0.5, ease: "back.out(2.5)" }, "-=0.2")
    .to({}, { duration: 2 * hold });

  return timeline;
}
