import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { authDeps } from "@/server/auth/auth-deps";
import { confirmEmailLink } from "@/server/auth/auth-service";

// Lien reçu par email (U04) : confirmation d'inscription ou réinitialisation du mot de passe.
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<never> {
  const target = await confirmEmailLink(request.nextUrl, authDeps());
  // redirect() de Next joint à la réponse les cookies de session écrits par Supabase (doc Supabase).
  redirect(target);
}
