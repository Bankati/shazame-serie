"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Bouton secondaire avec le « G » de Google. Le logo garde les couleurs imposées par la charte Google :
// fichier statique (public/brand), hors du vocabulaire de couleurs du projet.
export function GoogleSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending} className="h-11 w-full gap-3 text-base">
      <Image src="/brand/google-g.svg" alt="" width={20} height={20} unoptimized />
      {pending ? pendingLabel : label}
    </Button>
  );
}
