import { handleAccountRequest } from "@/server/auth/account-request";

// GET /api/account : compte connecté (menu de l'en-tête), ou null pour un visiteur.
export const runtime = "nodejs";

export function GET(): Promise<Response> {
  return handleAccountRequest();
}
