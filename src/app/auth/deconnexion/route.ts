import { NextResponse } from "next/server";

import { authDeps } from "@/server/auth/auth-deps";
import { signOut } from "@/server/auth/auth-service";
import { isSameOrigin } from "@/server/http/same-origin";

// POST /auth/deconnexion (U04) : formulaire HTML simple, la page entière est rechargée ensuite (en-tête,
// quota). RG9 : le jeton de cette session est révoqué.
export const runtime = "nodejs";

const SEE_OTHER = 303;

export async function POST(request: Request): Promise<NextResponse> {
  const home = new URL("/", request.url);
  if (!isSameOrigin(request)) {
    return NextResponse.redirect(home, SEE_OTHER);
  }
  await signOut(authDeps());
  return NextResponse.redirect(home, { status: SEE_OTHER, headers: { "Cache-Control": "no-store" } });
}
