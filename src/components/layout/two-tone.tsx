import { cn } from "@/lib/utils";

type TwoToneProps = {
  text: string;
  /** Mot ou groupe de mots de `text` mis en accent (AD-45) ; absent ou introuvable : texte uni. */
  highlight?: string;
  /** Accent sur fond `bg-inverse` : vert de marque plein. */
  tone?: "default" | "inverse";
};

// Grand titre en deux tons (U37) : le mot clé en vert d'accent, le reste dans la couleur du texte. Lu d'un seul
// tenant par les lecteurs d'écran (simple `span`, aucune coupure).
export function TwoTone({ text, highlight, tone = "default" }: TwoToneProps) {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || index === -1) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <span className={cn(tone === "inverse" ? "text-brand" : "text-brand-strong")}>{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
}
