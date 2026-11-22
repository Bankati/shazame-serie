import "server-only";

import { gte, isNull, sql } from "drizzle-orm";

import { parisDay } from "@/lib/paris-time";
import type { BillingPlan } from "@/server/billing/billing-provider";
import { isPremium } from "@/server/billing/premium-rule";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { aiSpendDaily, identifications, profiles, subscriptions } from "@/server/db/schema";
import { loadAiDailyCap } from "@/server/quota/settings";

import {
  DASHBOARD_DAYS,
  type DailyActivity,
  dayRange,
  estimateMrrCents,
  fillDays,
  percent,
  type PeriodTotals,
  sumPeriod,
} from "./dashboard-math";

// Indicateurs du tableau de bord admin (U25, CDC 12.9). Lecture seule ; l'appelant a vérifié le rôle admin.
// Jours en heure de Paris ; la période commence à minuit (Paris) du premier jour.

export type AdminDashboard = {
  days: string[];
  users: { total: number; newInPeriod: number };
  premium: { monthly: number; yearly: number; estimatedMrrCents: number };
  totals: PeriodTotals & { successRate: number | null; cacheShare: number | null };
  today: DailyActivity & { aiDailyCapMicroEur: number };
  /** Du plus récent au plus ancien, pour le tableau. */
  activity: DailyActivity[];
};

export async function loadAdminDashboard(db: Database, now: Date = new Date()): Promise<AdminDashboard> {
  const days = dayRange(parisDay(now), DASHBOARD_DAYS);
  const firstDay = days[0] as string;
  const periodStart = sql`(${firstDay}::date)::timestamp at time zone 'Europe/Paris'`;
  const parisDate = sql<string>`to_char(${identifications.createdAt} at time zone 'Europe/Paris', 'YYYY-MM-DD')`;

  const { userRows, identificationRows, spendRows, subscriptionRows } = await withQueryTimeout(db, async (tx) => {
    const userRows = await tx
      .select({
        total: sql<number>`count(*)::int`,
        newInPeriod: sql<number>`(count(*) filter (where ${profiles.createdAt} >= ${periodStart}))::int`,
      })
      .from(profiles)
      .where(isNull(profiles.deletedAt));
    const identificationRows = await tx
      .select({
        day: parisDate,
        total: sql<number>`count(*)::int`,
        shown: sql<number>`(count(*) filter (where ${identifications.outcome} = 'shown'))::int`,
        counted: sql<number>`(count(*) filter (where ${identifications.counted}))::int`,
        fromCache: sql<number>`(count(*) filter (where ${identifications.source} = 'cache'))::int`,
      })
      .from(identifications)
      .where(gte(identifications.createdAt, periodStart))
      .groupBy(parisDate);
    const spendRows = await tx
      .select({
        day: sql<string>`to_char(${aiSpendDaily.day}, 'YYYY-MM-DD')`,
        totalMicroEur: aiSpendDaily.totalMicroEur,
        calls: aiSpendDaily.calls,
      })
      .from(aiSpendDaily)
      .where(gte(aiSpendDaily.day, firstDay));
    const subscriptionRows = await tx
      .select({ plan: subscriptions.plan, status: subscriptions.status, currentPeriodEnd: subscriptions.currentPeriodEnd })
      .from(subscriptions);
    return { userRows, identificationRows, spendRows, subscriptionRows };
  });

  const premiumByPlan: Record<BillingPlan, number> = { monthly: 0, yearly: 0 };
  for (const row of subscriptionRows) {
    if (isPremium(row, now)) premiumByPlan[row.plan] += 1;
  }

  const activity = fillDays(days, identificationRows, spendRows);
  const totals = sumPeriod(activity);
  const today = activity.at(-1) as DailyActivity;

  return {
    days,
    users: userRows[0] ?? { total: 0, newInPeriod: 0 },
    premium: { ...premiumByPlan, estimatedMrrCents: estimateMrrCents(premiumByPlan) },
    totals: {
      ...totals,
      successRate: percent(totals.shown, totals.identifications),
      cacheShare: percent(totals.fromCache, totals.identifications),
    },
    today: { ...today, aiDailyCapMicroEur: await loadAiDailyCap(db) },
    activity: [...activity].reverse(),
  };
}
