"use client";

import { m } from "motion/react";

// Apparition au défilement : la section monte légèrement et s'éclaire quand elle entre dans l'écran.
// Rendue invisible côté serveur (`initial`) : sans JavaScript, la règle `noscript` du layout (attribut
// `data-reveal`) la rend visible, pour que le contenu ne disparaisse jamais.
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
