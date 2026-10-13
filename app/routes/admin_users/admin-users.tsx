import { cn } from "cn";
import { debounce, useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef } from "react";
import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { createServerClient } from "~/orpc/server-client.server";
import { UserDialog } from "~/routes/admin_users/components/user-dialog";
import { UserRow } from "~/routes/admin_users/components/user-row";
import { UserSearchField } from "~/routes/admin_users/components/user-search-field";
import { countUsers, filterUsers } from "~/routes/admin_users/filter-users";
import {
  ADMIN_USERS_PATH,
  adminUsersSearchParams,
  PAGE_SIZE,
  ROLE_FILTERS,
  type RoleFilter,
  serializeAdminUsersSearchParams,
  STATUS_FILTERS,
  type StatusFilter,
} from "~/routes/admin_users/search-params";

import type { Route } from "./+types/admin-users";

/*===== Constants =====*/
const ROLE_LABELS: Record<RoleFilter, string> = {
  all: "همه",
  customer: "مشتری",
  partner: "همکار",
  admin: "مدیر",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "همه",
  active: "فعال",
  blocked: "مسدود",
};

/** Typing waits this long before the URL moves: the list itself follows each key, the URL and history don't. */
const TYPING_DELAY_MS = 300;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "کاربران | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. The whole list comes once: the role, the status, the search, the counts, the paging and the
// open dialog are shallow URL state applied in the component, so changing them never waits for the server.
export async function loader({ request }: Route.LoaderArgs) {
  const users = await createServerClient(request).user.admin.list();
  return { users };
}

/*===== Admin Users =====*/
/**
 * F1 for the Admin: the roll of everyone with an account. He comes here to find a person, fix a misspelt name, or shut
 * an account (and open it again). Nobody is created here (partners are made on the Partners page, customers sign
 * themselves up) and a role never changes. A blocked person is drawn like a lost lead: dashed, dimmed, no gold.
 */
export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  /*------ URL State ------*/
  const [{ role, status, q, page: requestedPage, user: openId }, setParams] = useQueryStates(adminUsersSearchParams);

  /*------ Pending ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  /*------ Derived Lists ------*/
  const totals = useMemo(() => {
    let customers = 0;
    let partners = 0;
    let blocked = 0;
    for (const person of users) {
      if (person.role === "customer") customers += 1;
      if (person.role === "partner") partners += 1;
      if (person.status === "blocked") blocked += 1;
    }
    return { customers, partners, blocked };
  }, [users]);
  const { byRole, byStatus } = useMemo(() => countUsers({ users, role, status }), [users, role, status]);
  const matches = useMemo(() => filterUsers({ users, role, status, query: q }), [users, role, status, q]);

  // A page past the end (an old link, or the last match going away) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleUsers = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const listRef = useRef<HTMLDivElement>(null);

  /*------ Open Dialog ------*/
  // The dialog looks in the full list, so a write that changes the person doesn't close it.
  const opened = openId === null ? null : (users.find((person) => person.id === openId) ?? null);

  // An id that isn't in the list (an old link, or a person who is gone) opens nothing and leaves the URL clean.
  useEffect(() => {
    if (openId !== null && opened === null) void setParams({ user: null }, { history: "replace" });
  }, [openId, opened, setParams]);

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="کاربران"
        summary={
          `${formatNumberFa(users.length)} نفر؛ ${formatNumberFa(totals.customers)} مشتری، ` +
          `${formatNumberFa(totals.partners)} همکار، یک مدیر` +
          (totals.blocked > 0 ? `؛ ${formatNumberFa(totals.blocked)} مسدود` : "")
        }
      />

      {users.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState bubble="اینجا هنوز کسی نیست" title="کاربری نیست">
          وقتی کسی با شماره‌اش ثبت‌نام کند، اینجا می‌آید.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Search and Filters =====*/}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
            <UserSearchField
              value={q}
              onChange={(value) =>
                void setParams(
                  { q: value || null, page: null },
                  { history: "replace", limitUrlUpdates: debounce(TYPING_DELAY_MS) },
                )
              }
              onClear={() => void setParams({ q: null, page: null }, { history: "replace" })}
            />
            <div className="flex min-w-0 flex-col gap-2 lg:flex-1 lg:flex-row lg:flex-wrap lg:gap-x-6">
              <AdminFilterPills
                label="نقش"
                options={ROLE_FILTERS.map((value) => ({ value, label: ROLE_LABELS[value], count: byRole[value] }))}
                value={role}
                onChange={(next) => void setParams({ role: next, page: null }, { history: "replace" })}
              />
              <AdminFilterPills
                label="وضعیت"
                options={STATUS_FILTERS.map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                  count: byStatus[value],
                }))}
                value={status}
                onChange={(next) => void setParams({ status: next, page: null }, { history: "replace" })}
              />
            </div>
          </div>

          {/*===== The Roll =====*/}
          <div ref={listRef} aria-busy={busy} className={cn("scroll-mt-24 transition-opacity", busy && "opacity-60")}>
            {matches.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                کسی با این مشخصات پیدا نشد.
              </p>
            ) : (
              <ul aria-label="فهرست کاربران" className="flex flex-col gap-2">
                {visibleUsers.map((person) => (
                  <UserRow
                    key={person.id}
                    user={person}
                    href={serializeAdminUsersSearchParams(ADMIN_USERS_PATH, { user: person.id })}
                    onOpen={() => void setParams({ user: person.id })}
                  />
                ))}
              </ul>
            )}
          </div>

          {/*===== Pages =====*/}
          {pageCount > 1 && (
            <Pagination
              label="صفحه‌های کاربران"
              page={page - 1}
              pageCount={pageCount}
              className="mt-6"
              onPick={(next) => {
                // Paging is the one change the Back button should undo.
                void setParams({ page: next === 0 ? null : next + 1 }, { history: "push" });
                listRef.current?.scrollIntoView({ block: "start" });
              }}
            />
          )}
        </>
      )}

      {/*===== User Dialog =====*/}
      <UserDialog
        userId={openId}
        user={opened}
        // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
        // forward entry that reopens it.
        onClose={() => void setParams({ user: null }, { history: "replace" })}
      />
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-users-error-title">
      <h1 id="admin-users-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "کاربران باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/admin" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به مدیریت
      </Link>
    </section>
  );
}
