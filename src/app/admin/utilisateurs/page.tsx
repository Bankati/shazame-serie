import type { Metadata } from "next";

import { UserStatusForm } from "@/components/admin/user-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatParisDate } from "@/lib/paris-time";
import { searchUsers, USER_SEARCH_LIMIT } from "@/server/admin/users";
import { getDb } from "@/server/db/client";

import { userStatusAction } from "../actions";
import { requireAdminPage } from "../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.users.title, robots: { index: false, follow: false } };

const QUERY_MAX = 100;
const HEAD = "px-3 py-2 text-left font-medium";
const CELL = "px-3 py-2 align-top";

// Gestion des utilisateurs (U26, CDC 12.9) : recherche et suspension. Rôle admin relu en base avant toute lecture.
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const adminId = await requireAdminPage("/admin/utilisateurs");
  const raw = (await searchParams).q;
  const query = (typeof raw === "string" ? raw : "").slice(0, QUERY_MAX);
  const users = await searchUsers(getDb(), query);
  const text = ADMIN_TEXT.users;

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description(USER_SEARCH_LIMIT)}</p>
      </div>

      <form role="search" action="/admin/utilisateurs" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="recherche-utilisateur">{text.searchLabel}</Label>
          <Input
            id="recherche-utilisateur"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={QUERY_MAX}
            placeholder={text.searchPlaceholder}
            className="h-11 text-base"
          />
        </div>
        <Button type="submit" className="h-11">
          {text.searchSubmit}
        </Button>
      </form>

      <p role="status" className="text-sm text-muted-foreground">
        {users.length ? text.resultCount(users.length) : text.empty}
      </p>

      {users.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[44rem] text-sm text-card-foreground">
            <caption className="sr-only">{text.table.caption}</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th scope="col" className={HEAD}>
                  {text.table.user}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.createdAt}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.plan}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.status}
                </th>
                <th scope="col" className={HEAD}>
                  {text.table.action}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const editable = user.role !== "admin" && user.id !== adminId;
                return (
                  <tr key={user.id} className="border-b border-border last:border-b-0">
                    <th scope="row" className={`${CELL} text-left font-normal`}>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {user.displayName || text.noName}
                        {user.role === "admin" ? <Badge variant="secondary">{text.roleAdmin}</Badge> : null}
                      </span>
                      <span className="block break-all text-muted-foreground">{user.email ?? text.noEmail}</span>
                    </th>
                    <td className={`${CELL} whitespace-nowrap`}>{formatParisDate(user.createdAt)}</td>
                    <td className={CELL}>
                      {user.subscriptionPlan ? text.plans[user.subscriptionPlan] : text.plans.free}
                      {user.subscriptionStatus ? (
                        <span className="block text-muted-foreground">{text.subscriptionStatus[user.subscriptionStatus]}</span>
                      ) : null}
                    </td>
                    <td className={CELL}>
                      <Badge variant={user.status === "suspended" ? "destructive" : "outline"}>{text.statuses[user.status]}</Badge>
                    </td>
                    <td className={CELL}>
                      {editable ? (
                        <UserStatusForm action={userStatusAction} userId={user.id} status={user.status} />
                      ) : (
                        <span className="text-muted-foreground">{text.status.notAllowed}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
