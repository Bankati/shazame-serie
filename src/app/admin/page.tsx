import { notFound, redirect } from "next/navigation";

import { type DailyRow, DailyTable } from "@/components/admin/daily-table";
import { StatTile } from "@/components/admin/stat-tile";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatMicroEur, formatMoney } from "@/lib/money";
import { adminPageAccess } from "@/server/admin/access";
import { loadAdminDashboard } from "@/server/admin/dashboard";
import { requireAdmin } from "@/server/auth/guards";
import { getDb } from "@/server/db/client";

// Jour civil déjà calculé en heure de Paris : formaté tel quel (midi UTC, aucun décalage possible).
const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const formatDay = (day: string) => DAY_LABEL.format(new Date(`${day}T12:00:00Z`));
const formatPercent = (value: number | null) => (value === null ? ADMIN_TEXT.dashboard.none : `${value} %`);

// Tableau de bord admin (U25, CDC 12.9) : rôle admin relu en base avant toute lecture (invariant 7).
export default async function AdminDashboardPage() {
  const access = adminPageAccess(await requireAdmin());
  if (access.kind === "sign-in") redirect("/connexion?suite=/admin");
  if (access.kind === "not-found") notFound();

  const data = await loadAdminDashboard(getDb());
  const text = ADMIN_TEXT.dashboard;
  const rows: DailyRow[] = data.activity.map((day) => ({
    day: day.day,
    dayLabel: formatDay(day.day),
    identifications: day.identifications,
    shown: day.shown,
    counted: day.counted,
    fromCache: day.fromCache,
    aiCalls: day.aiCalls,
    aiCost: formatMicroEur(day.aiCostMicroEur),
  }));

  return (
    <div className="flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description(data.days.length)}</p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label={text.tiles.users}
          value={String(data.users.total)}
          hint={text.tiles.usersHint(data.users.newInPeriod)}
        />
        <StatTile
          label={text.tiles.today}
          value={String(data.today.identifications)}
          hint={text.tiles.todayHint(data.today.shown, data.today.counted)}
        />
        <StatTile
          label={text.tiles.successRate}
          value={formatPercent(data.totals.successRate)}
          hint={text.tiles.successRateHint(formatPercent(data.totals.cacheShare))}
        />
        <StatTile
          label={text.tiles.aiCost}
          value={formatMicroEur(data.today.aiCostMicroEur)}
          hint={text.tiles.aiCostHint(
            formatMicroEur(data.today.aiDailyCapMicroEur),
            formatMicroEur(data.totals.aiCostMicroEur),
          )}
        />
        <StatTile
          label={text.tiles.revenue}
          value={formatMoney(data.premium.estimatedMrrCents, "eur")}
          hint={text.tiles.revenueHint(data.premium.monthly, data.premium.yearly)}
        />
      </dl>

      <p className="text-sm text-muted-foreground">
        {text.revenueNote}{" "}
        <a
          href="https://dashboard.stripe.com/"
          target="_blank"
          rel="noreferrer"
          className="text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {text.stripeLink}
        </a>
      </p>

      <DailyTable rows={rows} />
    </div>
  );
}
