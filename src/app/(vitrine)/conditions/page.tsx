import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_TEXT } from "@/content/fr/legal";

const { terms } = LEGAL_TEXT;

export const metadata: Metadata = { title: terms.metaTitle };

export default function TermsPage() {
  return <LegalPage title={terms.title} version={terms.version} points={terms.points} />;
}
