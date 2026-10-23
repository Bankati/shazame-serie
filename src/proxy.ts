import type { NextRequest } from "next/server";

import { refreshSession } from "@/server/auth/supabase-proxy";

// Proxy Next 16 (ex-middleware) : rafraîchit la session Supabase (U04). Aucune redirection ici :
// les pages protégées vérifient elles-mêmes la session (requireUser).
export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Ni les fichiers statiques ni les images, ni le webhook de paiement (appelé par Stripe, sans session).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|api/billing/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
