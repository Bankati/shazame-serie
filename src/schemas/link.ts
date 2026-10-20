import { z } from "zod";

import { LINK_MAX_LENGTH } from "@/shared/links/parse-link";

// Contrat de POST /api/identify/link (U36). Le serveur analyse ensuite le lien (`parseVideoLink`).
export const linkRequestSchema = z.object({
  url: z.string().trim().min(1).max(LINK_MAX_LENGTH),
});

/** Motif d'un refus `LINK_UNSUPPORTED`, renvoyé dans `error.details.reason` pour un message adapté. */
export const linkRejectionSchema = z.enum(["invalid", "unsupported", "instagram"]);
