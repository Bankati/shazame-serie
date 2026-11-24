import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_TEXT } from "@/content/fr/admin";

export const metadata: Metadata = { title: ADMIN_TEXT.metaTitle, robots: { index: false, follow: false } };

// Le rôle admin est vérifié par chaque page (invariant 7), jamais par la mise en page seule : une mise en page
// n'est pas rendue de nouveau à chaque navigation.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
