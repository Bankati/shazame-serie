import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./accounts";
import { subscriptionPlan, subscriptionStatus } from "./enums";

// Statut Premium modifié uniquement par webhook vérifié ou action admin journalisée (invariant 5).
// Aucune donnée de carte (RG12) : seuls les identifiants du prestataire sont conservés.
export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerCustomerId: text("provider_customer_id").notNull(),
  providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
  plan: subscriptionPlan("plan").notNull(),
  status: subscriptionStatus("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Idempotence des webhooks : un événement déjà enregistré n'est jamais retraité.
export const billingEvents = pgTable("billing_events", {
  providerEventId: text("provider_event_id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
