import { z } from "zod";

// Contrat de POST /api/identify/description (U35), partagé par le serveur (validation) et le navigateur (champ).
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 500;

export const describeRequestSchema = z.object({
  text: z.string().trim().min(DESCRIPTION_MIN_LENGTH).max(DESCRIPTION_MAX_LENGTH),
});

export type DescribeRequest = z.infer<typeof describeRequestSchema>;
