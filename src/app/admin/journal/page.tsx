import type { Metadata } from "next";
import Link from "next/link";

import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatParisDateTime } from "@/lib/paris-time";
import { loadAuditLog } from "@/server/admin/audit";
import { getDb } from "@/server/db/client";

import { requireAdminPage } from "../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.audit.title, robots: { index: false, follow: false } };

const HEAD = "px-3 py-2 text-left font-medium";
const CELL = "px-3 py-2 align-top";
const PAGE_LINK =
  "inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const MAX_PAGE = 10_000;

const describeValue = (value: unknown) => (value === null || value === undefined ? "—" : JSON.stringify(value));

// Journal d'audit (U26, CDC 12.9, invariant 6) : lecture seule, du plus récent au plus ancien, 50 par page.
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireAdminPage("/admin/journal");
  const raw = (await searchParams).page;
  const parsed = Number.parseInt(typeof raw === "string" ? raw : "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_PAGE) : 1;
  const { rows, hasNext } = await loadAuditLog(getDb(), page);
  const text = ADMIN_TEXT.audit;

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[44rem] text-sm text-card-foreground">
            <caption className="sr-only">{`${text.table.caption}, ${text.page(page)}`}</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th scope="col" className={HEAD}>
                  {text.table.date}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.admin}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.action}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.target}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.change}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className={`${CELL} text-left font-normal whitespace-nowrap`}>
                    <time dateTime={row.createdAt.toISOString()}>{formatParisDateTime(row.createdAt)}</time>
                  </th>
                  <td className={CELL}>{row.adminId ? row.adminName || row.adminId : text.unknownAdmin}</td>
                  <td className={CELL}>{text.actions[row.action] ?? row.action}</td>
                  <td className={`${CELL} break-all`}>
                    {row.targetType}
                    {row.targetId ? <span className="block text-muted-foreground">{row.targetId}</span> : null}
                  </td>
                  <td className={`${CELL} font-mono text-xs break-all`}>
                    {describeValue(row.before)} → {describeValue(row.after)}
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
            <Link href={`/admin/journal?page=${page - 1}`} className={PAGE_LINK}>
              {text.previous}
            </Link>
          ) : null}
          {hasNext ? (
            <Link href={`/admin/journal?page=${page + 1}`} className={PAGE_LINK}>
              {text.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
