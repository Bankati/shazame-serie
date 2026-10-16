// Pas d'`import "server-only"` dans src/server/db/schema/ : drizzle-kit charge ces fichiers hors de Next
// (code-standards.md, exception documentée). Ils ne contiennent que des déclarations.
import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const accountStatus = pgEnum("account_status", ["active", "suspended"]);

// Types TMDB : un animé est un film ou une série (genre « Animation »), pas un type à part.
export const mediaType = pgEnum("media_type", ["movie", "tv"]);

export const identificationSource = pgEnum("identification_source", ["ai", "cache"]);
export const identificationOutcome = pgEnum("identification_outcome", ["shown", "low_confidence", "failed"]);

export const reportStatus = pgEnum("report_status", ["open", "reviewed", "added_to_eval", "rejected"]);

export const subscriptionPlan = pgEnum("subscription_plan", ["monthly", "yearly"]);
// Statut normalisé à la frontière du prestataire de paiement (architecture.md, BillingProvider).
export const subscriptionStatus = pgEnum("subscription_status", ["active", "past_due", "canceled", "expired"]);

export const consentKind = pgEnum("consent_kind", ["terms", "privacy", "b2b"]);
