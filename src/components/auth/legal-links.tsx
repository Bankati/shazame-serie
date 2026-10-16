import Link from "next/link";

// Phrase d'acceptation avec liens vers les textes (CDC 13.2 : liens visibles avant la création du compte).
type Parts = { before: string; terms: string; between: string; privacy: string; after: string };

const LINK_CLASS = "font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring";

export function LegalLinks({ parts }: { parts: Parts }) {
  return (
    <>
      {parts.before}
      <Link href="/conditions" target="_blank" className={LINK_CLASS}>
        {parts.terms}
      </Link>
      {parts.between}
      <Link href="/confidentialite" target="_blank" className={LINK_CLASS}>
        {parts.privacy}
      </Link>
      {parts.after}
    </>
  );
}
