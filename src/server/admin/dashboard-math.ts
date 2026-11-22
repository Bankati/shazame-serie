import { PLAN_PRICE_CENTS } from "@/server/billing/prices";
import type { BillingPlan } from "@/server/billing/billing-provider";

// Calculs purs du tableau de bord admin (U25), testés à part.

/** Nombre de jours du tableau de bord (aujourd'hui compris). */
export const DASHBOARD_DAYS = 30;

/** Les `count` jours civils (AAAA-MM-JJ) qui finissent par `lastDay`, du plus ancien au plus récent. */
export function dayRange(lastDay: string, count: number): string[] {
  const [year, month, day] = lastDay.split("-").map(Number) as [number, number, number];
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - (count - 1 - index)));
    return date.toISOString().slice(0, 10);
  });
}

export type DailyActivity = {
  day: string;
  identifications: number;
  shown: number;
  counted: number;
  fromCache: number;
  aiCostMicroEur: number;
  aiCalls: number;
};

type IdentificationDay = { day: string; total: number; shown: number; counted: number; fromCache: number };
type SpendDay = { day: string; totalMicroEur: number; calls: number };

/** Une ligne par jour de la période, les jours sans activité à zéro. */
export function fillDays(days: string[], identifications: IdentificationDay[], spend: SpendDay[]): DailyActivity[] {
  const byDay = new Map(identifications.map((row) => [row.day, row]));
  const spendByDay = new Map(spend.map((row) => [row.day, row]));
  return days.map((day) => {
    const ids = byDay.get(day);
    const cost = spendByDay.get(day);
    return {
      day,
      identifications: ids?.total ?? 0,
      shown: ids?.shown ?? 0,
      counted: ids?.counted ?? 0,
      fromCache: ids?.fromCache ?? 0,
      aiCostMicroEur: cost?.totalMicroEur ?? 0,
      aiCalls: cost?.calls ?? 0,
    };
  });
}

/** Pourcentage arrondi à l'entier ; null quand il n'y a rien à diviser. */
export function percent(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

/** Revenu mensuel récurrent estimé en centimes : mensuels au prix du mois, annuels ramenés au mois. */
export function estimateMrrCents(premiumByPlan: Record<BillingPlan, number>): number {
  return Math.round(
    premiumByPlan.monthly * PLAN_PRICE_CENTS.monthly + (premiumByPlan.yearly * PLAN_PRICE_CENTS.yearly) / 12,
  );
}

export type PeriodTotals = { identifications: number; shown: number; counted: number; fromCache: number; aiCostMicroEur: number };

export function sumPeriod(activity: DailyActivity[]): PeriodTotals {
  return activity.reduce<PeriodTotals>(
    (totals, day) => ({
      identifications: totals.identifications + day.identifications,
      shown: totals.shown + day.shown,
      counted: totals.counted + day.counted,
      fromCache: totals.fromCache + day.fromCache,
      aiCostMicroEur: totals.aiCostMicroEur + day.aiCostMicroEur,
    }),
    { identifications: 0, shown: 0, counted: 0, fromCache: 0, aiCostMicroEur: 0 },
  );
}
