import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { UsersRoundIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { normalizeForSearch } from "~/lib/search";
import type { AdminUser } from "~/orpc/user/contract";
import { orpc } from "~/orpc/client";
import { NoMatch } from "~/routes/admin_users/components/no-match";
import { LEAVE_MS, PageMotion } from "~/routes/admin_users/components/page-motion";
import { ResultLine } from "~/routes/admin_users/components/result-line";
import { ROLL_COLUMNS, ROLL_PADDING } from "~/routes/admin_users/components/roll-columns";
import { UserDialog } from "~/routes/admin_users/components/user-dialog";
import { UserRow } from "~/routes/admin_users/components/user-row";
import { UserSearchField } from "~/routes/admin_users/components/user-search-field";
import { countUsers, filterUsers } from "~/routes/admin_users/filter-users";
import { useSearchText } from "~/hooks/use-search-text";
import { type LeavingRow, withLeavingRows } from "~/routes/admin_users/leaving";
import { indexRollData } from "~/routes/admin_users/roll-data";
import {
  adminUsersSearchSchema,
  PAGE_SIZE,
  ROLE_FILTERS,
  type RoleFilter,
  STATUS_FILTERS,
  type StatusFilter,
} from "~/routes/admin_users/search-params";

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

/** A changed list staggers only its first rows in; the rest of a long page is simply there. */
const STAGGERED = 6;
const RISE_STEP_S = 0.05;

/*===== Queries =====*/
const usersQuery = () => orpc.user.admin.list.queryOptions();
const dogsQuery = () => orpc.dog.admin.list.queryOptions();
const partnersQuery = () => orpc.partner.admin.list.queryOptions();

/*===== Route =====*/
// The guard is the layout's. The whole roll comes once: the role, the status, the search, the counts, the paging and
// the open dialog are URL state applied in the component, so none is a loader dep and changing them never waits for
// the server. The dogs and the partners are read only for what the roll draws (a partner's code, a customer's dogs in
// the dialog).
export const Route = createFileRoute("/admin/users")({
  validateSearch: adminUsersSearchSchema,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(usersQuery()),
      queryClient.ensureQueryData(dogsQuery()),
      queryClient.ensureQueryData(partnersQuery()),
    ]),
  head: () => ({ meta: [{ title: "کاربران | مدیریت زروان" }] }),
  component: AdminUsersPage,
  notFoundComponent: () => <UsersError notFound />,
  errorComponent: () => <UsersError notFound={false} />,
});

/*===== Summary =====*/
/** «۲۵ نفر: ۲۲ مشتری، ۲ همکار، یه مدیر»، and how many are blocked when anyone is. */
function describeRoll(users: readonly AdminUser[]): string {
  let customers = 0;
  let partners = 0;
  let admins = 0;
  let blocked = 0;
  for (const person of users) {
    if (person.role === "customer") customers += 1;
    if (person.role === "partner") partners += 1;
    if (person.role === "admin") admins += 1;
    if (person.status === "blocked") blocked += 1;
  }
  const adminWords = admins === 1 ? "یه مدیر" : `${formatNumberFa(admins)} مدیر`;
  return (
    `${formatNumberFa(users.length)} نفر: ${formatNumberFa(customers)} مشتری، ${formatNumberFa(partners)} همکار، ` +
    adminWords +
    (blocked > 0 ? `؛ ${formatNumberFa(blocked)} تا مسدود` : "")
  );
}

/*===== Admin Users =====*/
/**
 * F1 for the Admin: the roll of everyone with an account, a roll call where only trouble shows. One plate holds dense
 * rows under a muted column head; a blocked person is dimmed in a dashed frame with the «مسدود» chip, and nothing on
 * the page is gold but the selected pills. He comes here to find a person, fix a misspelt name, or shut an account (and
 * open it again). Nobody is created here (partners are made on the Partners page, customers sign themselves up), no one
 * is deleted, and a role never changes.
 *
 * Motion only answers him: a filter, search or page change makes the first rows rise in and the counts pop; a block
 * dims its row and stamps the chip (an unblock brings it back); a saved name flashes its row once. Nothing moves on
 * load.
 */
function AdminUsersPage() {
  const { data: users, isFetching: usersFetching } = useSuspenseQuery(usersQuery());
  const { data: dogs, isFetching: dogsFetching } = useSuspenseQuery(dogsQuery());
  const { data: partners, isFetching: partnersFetching } = useSuspenseQuery(partnersQuery());
  const { dogsByOwner, partnersById } = useMemo(() => indexRollData({ dogs, partners }), [dogs, partners]);

  /*------ URL State ------*/
  const search = Route.useSearch();
  const role = search.role ?? "all";
  const status = search.status ?? "all";
  const openId = search.user ?? null;
  const navigate = useNavigate({ from: Route.fullPath });
  // The list follows each key; the URL's `q` follows after a pause, replacing its entry (and going back to page one).
  const searchText = useSearchText({
    urlText: search.q ?? "",
    delayMs: TYPING_DELAY_MS,
    commit: (text) =>
      void navigate({
        search: (prev) => ({ ...prev, q: text === "" ? undefined : text, page: undefined }),
        replace: true,
        resetScroll: false,
      }),
  });
  const q = searchText.text;
  // While a typed search waits for the URL, the list is already on its first page.
  const requestedPage = searchText.typing ? 1 : (search.page ?? 1);

  /*------ Pending ------*/
  // Only a reload of the lists dims the roll (the refetch after he saves or blocks); the URL state isn't a loader dep,
  // so typing and the pills never do, and leaving for another page shouldn't flash it.
  const pending = usersFetching || dogsFetching || partnersFetching;

  /** A new role or status pill (or both), from the first page. Replace: a filter isn't a place to go Back to. */
  function showFilters(next: { role?: RoleFilter; status?: StatusFilter }) {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...("role" in next && { role: next.role === "all" ? undefined : next.role }),
        ...("status" in next && { status: next.status === "all" ? undefined : next.status }),
        page: undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  /*------ Derived Lists ------*/
  const summary = useMemo(() => describeRoll(users), [users]);
  const { byRole, byStatus } = useMemo(() => countUsers({ users, role, status }), [users, role, status]);
  const matches = useMemo(() => filterUsers({ users, role, status, query: q }), [users, role, status, q]);
  const searching = normalizeForSearch(q) !== "";
  // Only asked for by the no-match view, to say the person is under «همه».
  const matchesInAll = useMemo(
    () =>
      searching && (role !== "all" || status !== "all") && matches.length === 0
        ? filterUsers({ users, role: "all", status: "all", query: q }).length
        : 0,
    [searching, role, status, matches.length, users, q],
  );

  // A page past the end (an old link, or the last match going away) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const pageUsers = useMemo(() => matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [matches, page]);

  /*------ Leaving Rows ------*/
  // A block or an unblock under «فعال» or «مسدود» takes the person out of the view: their copy stays in place for its
  // answer and fold (see `leaving.ts`).
  const [leaving, setLeaving] = useState<LeavingRow[]>([]);
  const batchRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  // A removal timer must not fire into an unmounted page.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const visibleUsers = useMemo(() => withLeavingRows({ rows: pageUsers, leaving }), [pageUsers, leaving]);
  const leavingIds = new Set(leaving.map((row) => row.user.id));
  const foldingIds = new Set(leaving.filter((row) => row.batch !== undefined).map((row) => row.user.id));

  /*------ Rise ------*/
  // The rows rise in only when he changed the view (a pill, the search, a page) and that changed who is listed, never
  // on load and never when a reload or an exit changed the rows under him. React's "adjust state on a prop change"
  // pattern, so the classes are there on the first frame.
  const viewKey = `${role}:${status}:${normalizeForSearch(q)}:${page}`;
  const idsKey = pageUsers.map((person) => person.id).join(",");
  const [view, setView] = useState({ viewKey, idsKey, rises: 0 });
  if (viewKey !== view.viewKey || idsKey !== view.idsKey) {
    const rises = viewKey !== view.viewKey && idsKey !== view.idsKey ? view.rises + 1 : view.rises;
    setView({ viewKey, idsKey, rises });
    // A new view never shows another view's exit.
    if (viewKey !== view.viewKey && leaving.length > 0) setLeaving([]);
  }
  const rising = view.rises > 0;

  /*------ Open Dialog ------*/
  // The dialog looks in the full list, so a write that changes the person doesn't close it.
  const opened = openId === null ? null : (users.find((person) => person.id === openId) ?? null);

  // An id that isn't in the list (an old link, or a person who is gone) opens nothing and leaves the URL clean.
  useEffect(() => {
    if (openId !== null && opened === null) {
      void navigate({ search: (prev) => ({ ...prev, user: undefined }), replace: true, resetScroll: false });
    }
  }, [openId, opened, navigate]);

  /*------ Exit Start ------*/
  // Once the dialog is closed (its button, Escape or Back), the rows it changed start their exit, not under its
  // backdrop, and leave when it's done. Rows that start together share a batch.
  const waiting = openId === null && leaving.some((row) => row.batch === undefined);
  useEffect(() => {
    if (!waiting) return;
    const batch = ++batchRef.current;
    setLeaving((previous) => previous.map((row) => (row.batch === undefined ? { ...row, batch } : row)));
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setLeaving((previous) => previous.filter((row) => row.batch !== batch));
    }, LEAVE_MS);
    timersRef.current.add(timer);
  }, [waiting]);

  /*------ Pager Scroll ------*/
  // A new page starts at the roll's top, under the sticky header (`scroll-mt-24`).
  const listRef = useRef<HTMLElement>(null);
  function scrollToRoll() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  /*------ Handlers ------*/
  function clearSearch() {
    searchText.set("");
  }

  /** The API accepted a block or an unblock: when it takes the person out of the status pill, keep the row a moment. */
  function keepLeavingRow(saved: AdminUser) {
    if (status === "all" || saved.status === status) return;
    // Under reduced motion there is no exit to play: the reload simply takes the row away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const index = visibleUsers.findIndex((person) => person.id === saved.id);
    if (index < 0) return;
    const before = visibleUsers
      .slice(0, index)
      .map((person) => person.id)
      // oxlint-disable-next-line unicorn/no-array-reverse -- a fresh array from `map`; the project's lib has no `toReversed`
      .reverse();
    setLeaving((previous) => [...previous.filter((row) => row.user.id !== saved.id), { user: saved, before }]);
  }

  function closeDialog() {
    // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
    // forward entry that reopens it.
    void navigate({ search: (prev) => ({ ...prev, user: undefined }), replace: true, resetScroll: false });
  }

  return (
    <div>
      <PageMotion />

      {/*===== Header =====*/}
      <AdminPageHeader title="کاربران" summary={users.length > 0 ? summary : undefined} />

      {users.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="هنوز کسی نیست" icon={UsersRoundIcon}>
          وقتی کسی با شماره‌اش ثبت‌نام کنه، این‌جا میاد.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Search =====*/}
          <div className="flex flex-col gap-1.5">
            <UserSearchField value={q} onChange={searchText.change} onClear={clearSearch} />
            <div className="ps-5">
              <ResultLine searching={searching} count={matches.length} />
            </div>
          </div>

          {/*===== Pills =====*/}
          {/* Two rows of pills, each counted within the other's choice. One line split by the slip's tear from `xl`
              (beside the rail at 1024 the two rows don't fit one line); stacked below it, where on a phone each row
              scrolls sideways. A count that changes under him pops in the pill. */}
          <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4">
            <AdminFilterPills
              label="نقش"
              options={ROLE_FILTERS.map((value) => ({ value, label: ROLE_LABELS[value], count: byRole[value] }))}
              value={role}
              onChange={(next) => showFilters({ role: next })}
              className="xl:flex-nowrap"
            />
            <span aria-hidden className={cn("hidden h-7 shrink-0 border-s xl:block", ADMIN_TEAR)} />
            <AdminFilterPills
              label="وضعیت"
              options={STATUS_FILTERS.map((value) => ({
                value,
                label: STATUS_LABELS[value],
                count: byStatus[value],
              }))}
              value={status}
              onChange={(next) => showFilters({ status: next })}
              className="xl:flex-nowrap"
            />
          </div>

          {/*===== The Roll =====*/}
          <section
            ref={listRef}
            aria-labelledby="admin-users-roll"
            aria-busy={pending}
            className={cn("mt-5 scroll-mt-24 transition-opacity", pending && "opacity-60")}
          >
            <h2 id="admin-users-roll" className="sr-only">
              فهرست کاربران
            </h2>

            {visibleUsers.length === 0 ? (
              <NoMatch
                key={view.rises}
                query={q}
                searching={searching}
                role={role}
                status={status}
                matchesInAll={matchesInAll}
                onClear={clearSearch}
                onShowAll={() => showFilters({ role: "all", status: "all" })}
                className={cn(rising && "answer-in")}
              />
            ) : (
              <div className={cn(ADMIN_PLATE, "overflow-hidden")}>
                {/*------ Column Head ------*/}
                {/* Only where the row is one line in fixed tracks; the rows say the same to a screen reader. */}
                <div
                  aria-hidden
                  className={cn(
                    "hidden border-b py-2.5 text-xs text-muted-foreground xl:grid",
                    ROLL_COLUMNS,
                    ROLL_PADDING,
                    ADMIN_HAIRLINE,
                  )}
                >
                  <span className="col-span-2">کاربر</span>
                  <span>شماره</span>
                  <span>ثبت‌نام</span>
                  <span>آخرین ورود</span>
                  <span>سگ یا کد</span>
                </div>

                {/*------ Rows ------*/}
                <ul key={view.rises} className={cn("divide-y", ADMIN_HAIRLINE)}>
                  {visibleUsers.map((person, index) => (
                    <UserRow
                      key={person.id}
                      user={person}
                      search={{ ...search, user: person.id }}
                      partnerCode={partnersById[person.id]?.code}
                      open={person.id === openId}
                      rise={rising && index < STAGGERED ? index * RISE_STEP_S : null}
                      leaving={leavingIds.has(person.id)}
                      folding={foldingIds.has(person.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/*===== Pages =====*/}
          {pageCount > 1 && (
            <Pagination
              label="صفحه‌های کاربران"
              page={page - 1}
              pageCount={pageCount}
              className="mt-6"
              onPick={(next) => {
                // Paging is the one change the Back button should undo.
                void navigate({
                  search: (prev) => ({ ...prev, page: next === 0 ? undefined : next + 1 }),
                  resetScroll: false,
                });
                scrollToRoll();
              }}
            />
          )}
        </>
      )}

      {/*===== User Dialog =====*/}
      <UserDialog
        userId={openId}
        user={opened}
        dogs={(opened && dogsByOwner[opened.id]) ?? []}
        partner={opened ? partnersById[opened.id] : undefined}
        onClose={closeDialog}
        onStatusConfirmed={keepLeavingRow}
      />
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
function UsersError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "کاربران باز نشد"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
