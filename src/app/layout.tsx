import type { Metadata } from "next";

import { APP_TEXT } from "@/content/fr/app";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_TEXT.name,
  description: APP_TEXT.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
