import { handleAvatarDelete, handleAvatarUpload } from "@/server/account/account-requests";

// Photo de profil du compte connecté (U05) : envoi (réencodée par le serveur) et retrait.
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleAvatarUpload(request);
}

export function DELETE(request: Request): Promise<Response> {
  return handleAvatarDelete(request);
}
