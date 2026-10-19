import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_OPTIONS, isAuthCookie } from "./cookies";

// Rafraîchissement de la session dans `src/proxy.ts` (doc Supabase « server-side auth » pour Next.js).
// Pas d'`import "server-only"` ni de `env.ts` : le proxy est compilé à part, il lit les deux variables
// publiques directement.
//
// Seules les requêtes qui portent un cookie de session paient l'appel : les visiteurs (et les fiches en cache)
// ne sont pas ralentis.
export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !request.cookies.getAll().some((cookie) => isAuthCookie(cookie.name))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Réponse portant un jeton : jamais mise en cache par un CDN (sinon fuite de session).
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  try {
    // Rien entre la création du client et getClaims() (recommandation Supabase) : c'est cet appel qui
    // rafraîchit un jeton expiré et réécrit les cookies.
    await supabase.auth.getClaims();
  } catch {
    // Supabase injoignable : la page s'affiche quand même, la session sera revérifiée par le serveur.
  }
  return response;
}
