import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_TEXT } from "@/content/fr/legal";

const { privacy } = LEGAL_TEXT;

export const metadata: Metadata = { title: privacy.metaTitle };

export default function PrivacyPage() {
  return <LegalPage title={privacy.title} version={privacy.version} points={privacy.points} />;
}
