import { z } from "zod";

// GET /api/account (U04) : compte connecté, pour le menu de l'en-tête. null pour un visiteur.
export const accountSummarySchema = z.object({
  account: z
    .object({
      displayName: z.string().nullable(),
      email: z.string().nullable(),
      // Lien signé (1 h) vers la photo du bucket privé, ou null.
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});

export type AccountSummary = z.infer<typeof accountSummarySchema>;
