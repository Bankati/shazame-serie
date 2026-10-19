import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { authDeps } from "@/server/auth/auth-deps";
import { completeGoogleSignIn } from "@/server/auth/auth-service";

// Retour de Google via Supabase (U04) : échange du code contre une session.
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<never> {
  const target = await completeGoogleSignIn(request.nextUrl, authDeps());
  // redirect() de Next joint à la réponse les cookies de session écrits par Supabase (doc Supabase).
  redirect(target);
}
