import type { Metadata } from "next";
import Link from "next/link";

import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatParisDateTime } from "@/lib/paris-time";
import { cn } from "@/lib/utils";
import type { ReportStatus, TitleRef } from "@/server/admin/report-review-rules";
import { labelOf, listReports, loadTitleLabels, REPORT_STATUSES } from "@/server/admin/reports-admin";
import { getDb } from "@/server/db/client";

import { requireAdminPage } from "../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.reports.title, robots: { index: false, follow: false } };

const HEAD = "px-3 py-2 text-left font-medium";
const CELL = "px-3 py-2 align-top";
const PAGE_LINK =
  "inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const MAX_PAGE = 10_000;

const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

// Revue des signalements (U26b, CDC 12.9) : liste par statut, 50 par page, plus récents d'abord.
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string | string[]; page?: string | string[] }>;
}) {
  await requireAdminPage("/admin/signalements");
  const params = await searchParams;
  const rawStatus = first(params.statut);
  const status: ReportStatus = REPORT_STATUSES.find((value) => value === rawStatus) ?? "open";
  const parsed = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_PAGE) : 1;
  const { rows, hasNext } = await listReports(getDb(), status, page);
  const labels = await loadTitleLabels(rows.flatMap((row) => [row.proposed, row.suggested]));
  const text = ADMIN_TEXT.reports;
  const describe = (title: TitleRef | null) => (title ? (labelOf(labels, title) ?? text.titleUnavailable(title)) : text.noTitle);
  const pageHref = (target: number) => `/admin/signalements?statut=${status}&page=${target}`;

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
      </div>

      <nav aria-label={text.filterLabel} className="flex flex-wrap gap-2">
        {REPORT_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/signalements?statut=${value}`}
            aria-current={value === status ? "page" : undefined}
            className={cn(PAGE_LINK, value === status && "bg-accent")}
          >
            {text.statuses[value]}
          </Link>
        ))}
      </nav>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[44rem] text-sm text-card-foreground">
            <caption className="sr-only">{`${text.table.caption}, ${text.statuses[status]}, ${text.page(page)}`}</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th scope="col" className={HEAD}>
                  {text.table.date}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.proposed}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.suggested}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.images}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.action}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className={`${CELL} whitespace-nowrap`}>{formatParisDateTime(row.createdAt)}</td>
                  <td className={CELL}>{describe(row.proposed)}</td>
                  <td className={CELL}>{describe(row.suggested)}</td>
                  <td className={`${CELL} whitespace-nowrap`}>{text.imageCount(row.imageCount)}</td>
                  <td className={CELL}>
                    <Link href={`/admin/signalements/${row.id}`} className="font-medium text-foreground underline underline-offset-4">
                      {text.open}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{text.empty}</p>
      )}

      {page > 1 || hasNext ? (
        <nav aria-label={text.title} className="flex gap-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={PAGE_LINK}>
              {text.previous}
            </Link>
          ) : null}
          {hasNext ? (
            <Link href={pageHref(page + 1)} className={PAGE_LINK}>
              {text.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
