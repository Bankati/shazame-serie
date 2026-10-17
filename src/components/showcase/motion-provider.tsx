"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

// Animations du site (Motion, AD-36) : chargement allégé (`LazyMotion` + `domAnimation`, composants `m.*`
// uniquement grâce à `strict`) et respect du réglage « réduire les animations » du système.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
