import { TwoTone } from "@/components/layout/two-tone";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  /** Mot clé du titre mis en vert d'accent (U37, AD-45). */
  highlight?: string;
  subtitle?: string;
  align?: "center" | "start";
  tone?: "default" | "inverse";
};

// En-tête de section : sur-titre en majuscules espacées, titre éditorial en deux tons, sous-titre court.
export function SectionHeading({ id, eyebrow, title, highlight, subtitle, align = "center", tone = "default" }: SectionHeadingProps) {
  const inverse = tone === "inverse";

  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", align === "center" && "mx-auto items-center text-center")}>
      <p className={cn("text-xs font-semibold uppercase tracking-widest", inverse ? "text-brand-light" : "text-brand-strong")}>{eyebrow}</p>
      <h2 id={id} className="font-display text-display font-bold md:text-display-lg">
        <TwoTone text={title} highlight={highlight} tone={tone} />
      </h2>
      {subtitle ? (
        <p className={cn("text-base md:text-lg", inverse ? "text-inverse-muted" : "text-muted-foreground")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
