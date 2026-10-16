import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
  tone?: "default" | "inverse";
};

// En-tête de section : sur-titre vert lisible, titre éditorial, sous-titre court.
export function SectionHeading({ id, eyebrow, title, subtitle, align = "center", tone = "default" }: SectionHeadingProps) {
  const inverse = tone === "inverse";

  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", align === "center" && "mx-auto items-center text-center")}>
      <p className={cn("text-sm font-semibold", inverse ? "text-brand" : "text-brand-strong")}>{eyebrow}</p>
      <h2 id={id} className="font-display text-display font-bold md:text-display-lg">
        {title}
      </h2>
      {subtitle ? (
        <p className={cn("text-base md:text-lg", inverse ? "text-inverse-muted" : "text-muted-foreground")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
