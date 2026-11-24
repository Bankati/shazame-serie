import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action: { href: string; label: string };
};

// État vide commun à l'application (U40) : icône dans une pastille d'accent, titre, explication, une seule action.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-10 text-center md:py-14">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-subtle">
        <Icon className="size-7 text-brand-strong" aria-hidden="true" />
      </span>
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <p className="max-w-prose text-sm text-muted-foreground md:text-base">{description}</p>
      <Button asChild className="h-11 px-5 text-base hover:bg-primary-hover">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}
