import { z } from "zod";

// Contrat de GET /api/titles/{movie|tv}/{id}/watch (U16), partagé entre serveur et navigateur.

export const ACCESS_TYPES = ["flatrate", "free", "ads", "rent", "buy"] as const;
export type AccessType = (typeof ACCESS_TYPES)[number];

export const watchServiceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  logoPath: z.string().nullable(),
});

export const watchAvailabilitySchema = z.object({
  /** Pays affiché (ISO 3166-1 alpha-2). */
  country: z.string().regex(/^[A-Z]{2}$/),
  /** Pays pour lesquels des données existent, triés. */
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)),
  /** Page récapitulative du pays (liens JustWatch par service), ou null si aucune donnée. */
  link: z.url({ protocol: /^https$/ }).nullable(),
  offers: z.object({
    flatrate: z.array(watchServiceSchema),
    free: z.array(watchServiceSchema),
    ads: z.array(watchServiceSchema),
    rent: z.array(watchServiceSchema),
    buy: z.array(watchServiceSchema),
  }),
});

export type WatchService = z.infer<typeof watchServiceSchema>;
export type WatchAvailability = z.infer<typeof watchAvailabilitySchema>;
