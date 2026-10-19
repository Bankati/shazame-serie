"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Bandeau d'images courbé du hero (demandé par le fondateur le 16 octobre 2026), adapté du composant
// « TiltedGridHero » fourni : une rangée d'images défile de droite à gauche sur l'intérieur d'un cylindre,
// le centre face à l'écran, les extrémités recourbées vers le spectateur et fondues dans la page.
//
// Une boîte CSS ne se courbe pas : chaque tuile est découpée en SLICES bandes verticales, chacune tournée de
// quelques degrés autour de l'axe du cylindre. C'est la tuile (preserve-3d) qui tourne le long de l'arc :
// une seule animation par tuile, transformée sur le compositeur. Le seul JavaScript : un ResizeObserver qui
// dimensionne la boucle, et le changement d'image d'une tuile quand elle repasse hors champ.
//
// Adaptations au projet : décoratif (aria-hidden), chargé seulement après le chargement de la page et
// un temps calme du navigateur (le premier écran et la zone d'envoi passent d'abord), désactivé si
// l'appareil demande d'économiser les données, animation en pause si l'utilisateur réduit les animations.

const SLICES = 16;
// Distance de la caméra, en multiple du rayon du cylindre.
const CAMERA = 1.6;
// Une tuile ne dépasse jamais cette part de la largeur : sur téléphone, on voit encore ses voisines.
const MAX_WIDTH = 55;

/** Rayon du cylindre (part de la largeur) qui place le bord du cadre à `bend` radians sur l'arc. */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

/**
 * Pose la boucle sur le cylindre. Angles en degrés : `unit` = arc couvert par une hauteur de tuile,
 * `limit` = au-delà, la tuile est entièrement hors champ, `sweep` = position des extrémités de la boucle
 * (arrondie à un nombre entier de tuiles pour que l'écart ne s'étire jamais).
 */
function measure(width: number, height: number, tile: number, aspect: number, gap: number, bend: number) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect);
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Plafonné : un cadre réduit à un filet ne doit pas monter des milliers de tuiles.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
}

type Layout = ReturnType<typeof measure>;

/** Attribut qui met le bandeau en pause tant qu'il est présent dans la page. */
export const PAUSE_ATTRIBUTE = "data-pause-motion";

export type CurvedFilmBandProps = {
  /** Images (décoratives) parcourues dans l'ordre ; une liste courte se répète. */
  images: readonly string[];
  /** Secondes pour avancer d'une tuile. */
  speed?: number;
  /** Hauteur d'une tuile, en % de la hauteur du cadre. */
  tileHeight?: number;
  /** Largeur / hauteur d'une tuile. */
  aspectRatio?: number;
  /** Écart entre tuiles, en % de la hauteur d'une tuile. */
  gap?: number;
  /** Centre vertical de la rangée, en % de la hauteur du cadre. */
  axis?: number;
  /** Courbure au bord du cadre, en degrés (5 à 85). */
  curve?: number;
  /** Largeur du fondu à chaque extrémité, en % de la largeur. */
  fade?: number;
  className?: string;
};

export function CurvedFilmBand({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 50,
  curve = 80,
  fade = 12,
  className,
}: CurvedFilmBandProps) {
  const ready = useDeferredStart();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `cfb-o-${id}`;
  const tile = `cfb-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Null tant que le cadre n'est pas mesuré : le bandeau reste invisible (pas de premier rendu faux).
  const [layout, setLayout] = useState<Layout | null>(null);
  // Image affichée par chaque tuile ; ne change que quand la tuile repasse hors champ.
  const [shown, setShown] = useState<Record<number, number>>({});

  useEffect(() => {
    const element = ref.current;
    if (!ready || !element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((previous) =>
        previous?.columns === next.columns && previous.sweep === next.sweep && previous.unit === next.unit ? previous : next,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready, tileHeight, aspectRatio, gap, bend]);

  // Toutes les images chargées d'avance : une tuile prend la suivante juste avant de réapparaître.
  useEffect(() => {
    if (!ready) return;
    for (const src of images) new Image().src = src;
  }, [ready, images]);

  if (!ready) {
    return <div aria-hidden="true" className={cn("pointer-events-none", className)} />;
  }

  const { columns, sweep, unit, limit } = layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);

  // Toutes les longueurs sont des multiples de la hauteur d'une tuile.
  const u = (n: number) => `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw))`;
  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  const turn = (deg: number) => `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  // Au-delà de `limit`, la tuile est hors champ : masquée (extrémités de la boucle, passage derrière la caméra).
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    // En pause plutôt que retiré : chaque tuile reste placée, le bandeau devient une image fixe.
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused}}` +
    // Pause aussi dès qu'un élément de la page porte `data-pause-motion` (clip en cours d'analyse) :
    // l'animation 3D ralentissait fortement l'extraction des images sur un appareil modeste.
    `:root:has([${PAUSE_ATTRIBUTE}]) .${tile}{animation-play-state:paused}`;

  const share = aspectRatio / SLICES;
  const duration = columns * speed;
  // Masque de fondu : seule l'opacité compte (la couleur du masque n'apparaît jamais à l'écran).
  const mask = `linear-gradient(90deg,transparent,black ${fade}%,black ${100 - fade}%,transparent)`;

  return (
    <div ref={ref} aria-hidden="true" className={cn("pointer-events-none overflow-hidden", className)} style={{ containerType: "size" }}>
      <style>{css}</style>
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // La tuile `columns - 1` part la plus proche de la sortie : numérotation dans l'ordre d'entrée.
          const first = columns - 1 - t;
          const src = images[(shown[t] ?? first) % Math.max(images.length, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
              }}
              onAnimationIteration={(event) => {
                // elapsedTime compte les tours entiers, y compris ceux dont l'événement a été manqué.
                const lap = Math.round(event.elapsedTime / duration);
                setShown((previous) => {
                  const next = lap * columns + first;
                  return previous[t] === next ? previous : { ...previous, [t]: next };
                });
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-inverse-foreground/10",
                    k === 0 && "rounded-l-lg",
                    k === SLICES - 1 && "rounded-r-lg",
                  )}
                  style={{
                    left: u((aspectRatio - share) / 2),
                    // Un pixel de plus que sa part : aucune ligne claire entre deux bandes voisines.
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                  }}
                >
                  {src ? (
                    // Image brute : chaque bande affiche sa part de la même image, positionnée au pixel près
                    // (next/image ne s'y prête pas) ; le fichier est déjà dimensionné et compressé (public/hero).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      draggable={false}
                      decoding="async"
                      className="absolute top-0 max-w-none object-cover"
                      style={{ left: u(-k * share), width: u(aspectRatio), height: u(1) }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type NetworkInformation = { saveData?: boolean };

/**
 * Vrai après le chargement de la page et un temps calme du navigateur, sauf si l'appareil demande
 * d'économiser les données : le bandeau (environ 300 Ko d'images) ne concurrence jamais le premier écran.
 */
function useDeferredStart(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;
    let cancel = () => {};
    const start = () => {
      const go = () => setReady(true);
      // Safari n'a pas requestIdleCallback : court délai à la place.
      if (typeof window.requestIdleCallback === "function") {
        const handle = window.requestIdleCallback(go, { timeout: 2000 });
        cancel = () => window.cancelIdleCallback(handle);
      } else {
        const handle = window.setTimeout(go, 200);
        cancel = () => window.clearTimeout(handle);
      }
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      cancel();
    };
  }, []);
  return ready;
}
