import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { MessageSquareDashedIcon, MessageSquareTextIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { SHOWCASE_SIGN_IN_CODE } from "~/lib/user-constants";
import { orpc } from "~/orpc/client";
import { SMS_KIND_LABELS, SMS_KINDS, SMS_PAGE_SIZE, type SmsKind } from "~/orpc/sms/constants";
import { SmsMessageRow } from "~/routes/admin_sms/components/sms-message-row";
import { describeDay } from "~/routes/admin_sms/dates";
import { groupByDay } from "~/routes/admin_sms/day-groups";
import { smsSearchSchema } from "~/routes/admin_sms/search-params";

/*===== Constants =====*/
/** A list that arrived under a new kind or page staggers its first rows in; the rest of the page is simply there. */
const STAGGERED = 6;
const RISE_STEP_S = 0.05;

/*===== Queries =====*/
/** One page of the outbox; `page` is 1-based, as in the URL (the API's is 0-based). */
const listQuery = ({ kind, page }: { kind: SmsKind | undefined; page: number }) =>
  orpc.sms.admin.list.queryOptions({ input: { kind, page: Math.max(page - 1, 0) } });
// The header counts every message and shows the newest of them, so a filtered or later page also reads the first page
// of the whole outbox (the same query as the list's when that is the page on screen).
const newestQuery = () => listQuery({ kind: undefined, page: 1 });
// The links the app writes into its own messages start with the site's origin, so a bubble can open them here.
const siteQuery = () => orpc.site.config.queryOptions();

/*===== Route =====*/
// The outbox grows with every sign-in code, so the API pages it: the kind and the page are loader deps, and changing
// either fetches that page. A page past the end (an old link, or a filter that got narrower) is redirected to the last
// page, so the URL always shows what the list shows.
export const Route = createFileRoute("/admin/sms")({
  validateSearch: smsSearchSchema,
  loaderDeps: ({ search }) => ({ kind: search.kind, page: search.page ?? 1 }),
  loader: async ({ context: { queryClient }, deps: { kind, page } }) => {
    const [list] = await Promise.all([
      queryClient.ensureQueryData(listQuery({ kind, page })),
      queryClient.ensureQueryData(newestQuery()),
      queryClient.ensureQueryData(siteQuery()),
    ]);

    const pageCount = Math.max(1, Math.ceil(list.total / SMS_PAGE_SIZE));
    const current = Math.min(Math.max(page, 1), pageCount);
    if (current !== page) {
      throw redirect({ to: "/admin/sms", search: { kind, page: current === 1 ? undefined : current } });
    }
  },
  head: () => ({ meta: [{ title: "پیامک‌ها | مدیریت زروان" }] }),
  component: AdminSmsPage,
  notFoundComponent: () => <SmsError notFound />,
  errorComponent: () => <SmsError notFound={false} />,
});

/*===== Helpers =====*/
function sumCounts(counts: Partial<Record<SmsKind, number>>): number {
  return Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
}

/*===== Page =====*/
/**
 * F9 in showcase mode: every message the app would have sent, since none is really sent. A read-only thread list, newest
 * first, grouped by the Tehran day under muted labels inside one plate, each message a row with its bubble as the
 * receiver's phone would show it. Paged on the server (the one Admin list that is); nothing here is resent or deleted.
 *
 * Motion only answers him: a new kind or page makes the first rows rise in. Nothing moves on load or on a refetch.
 */
function AdminSmsPage() {
  /*------ URL State ------*/
  // Both are loader deps, so a change waits for its page. Changing the kind starts again on the first page.
  const { kind, page: requestedPage = 1 } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  /*------ Data ------*/
  const {
    data: { items, total, kindCounts },
  } = useSuspenseQuery(listQuery({ kind, page: requestedPage }));
  const { data: everything } = useSuspenseQuery(newestQuery());
  const {
    data: { origin: appOrigin },
  } = useSuspenseQuery(siteQuery());
  // The loader has sent a page past the end to the last one, so the URL's page is the one shown.
  const pageCount = Math.max(1, Math.ceil(total / SMS_PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  // The unfiltered list's counts are the same whatever the filter, so `kindCounts` is the whole outbox's count.
  const allTotal = sumCounts(kindCounts);
  const newest = everything.items[0]?.createdAt ?? null;

  /*------ Pending ------*/
  // A change to this page's own URL dims the list while its page loads; leaving for another Admin page shouldn't
  // flash it.
  const pending = useRouterState({
    select: (state) => state.status === "pending" && state.location.pathname === state.resolvedLocation?.pathname,
  });

  /*------ Days ------*/
  const days = useMemo(() => groupByDay(items), [items]);

  /*------ Motion ------*/
  // The rows rise in once the kind or the page has changed (React's "adjust state on a prop change" pattern), never on
  // load. Keyed by the view, not by the rows, so a new message arriving on a refetch moves nothing.
  const viewKey = `${kind ?? "all"}:${page}`;
  const [lastViewKey, setLastViewKey] = useState(viewKey);
  const [moved, setMoved] = useState(false);
  if (viewKey !== lastViewKey) {
    setLastViewKey(viewKey);
    setMoved(true);
  }

  /*------ Pager Scroll ------*/
  // A new page starts at the list's top, under the sticky header (`scroll-mt-24`).
  const listRef = useRef<HTMLElement>(null);
  function scrollToList() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  /*------ Empty Outbox ------*/
  if (newest === null) {
    return (
      <div>
        <AdminPageHeader title="پیامک‌ها" />
        <ShowcaseNote />
        <AdminEmptyState title="هنوز پیامی نرفته" icon={MessageSquareTextIcon}>
          وقتی کسی کد ورود بخواد یا خریدی بکنه، پیامش این‌جا میاد.
        </AdminEmptyState>
      </div>
    );
  }

  /*------ Kind Pills ------*/
  // Only kinds that have rows get a pill, plus the one in the URL even when it has none (an old link), so the selected
  // filter always shows. The order is the constant's, so the row reads the same every time.
  const kindOptions = SMS_KINDS.filter((value) => (kindCounts[value] ?? 0) > 0 || value === kind).map((value) => ({
    value,
    label: SMS_KIND_LABELS[value],
    count: kindCounts[value] ?? 0,
  }));

  /*------ Rendering Helpers ------*/
  // One running index across the days, so a day's label rises with its first message and the stagger stays in order.
  let riseIndex = 0;
  const nextRise = () => {
    const index = riseIndex++;
    return moved && index < STAGGERED ? index * RISE_STEP_S : null;
  };

  return (
    <div>
      {/*===== Header =====*/}
      {/* «،» rather than «·»: a middle dot beside a Persian digit reads as a zero (as on the Overview). */}
      <AdminPageHeader
        title="پیامک‌ها"
        summary={`${formatNumberFa(allTotal)} پیام، تازه‌ترینش ${formatJalaliTimestamp(newest)}`}
      />
      <ShowcaseNote />

      {/*===== Filter =====*/}
      {/* Up to ten kinds: on phones and tablets one row that scrolls sideways (the pills' own phone behaviour, kept to
          `lg` so a tablet doesn't stack three lines); from `lg`, beside the rail, they wrap with the same gap both ways. */}
      <AdminFilterPills<SmsKind | "all">
        label="نوع پیام"
        className="sm:flex-nowrap sm:overflow-x-auto lg:flex-wrap lg:overflow-visible"
        value={kind ?? "all"}
        onChange={(next) =>
          void navigate({
            search: (prev) => ({ ...prev, kind: next === "all" ? undefined : next, page: undefined }),
            replace: true,
            resetScroll: false,
          })
        }
        options={[{ value: "all", label: "همه", count: allTotal }, ...kindOptions]}
      />
      {kind === "sign-in-code" && (
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          کد همه‌ی پیام‌های ورود <bdi dir="ltr">{toPersianDigits(SHOWCASE_SIGN_IN_CODE)}</bdi> هست؛ تا وقتی پیامک واقعی
          وصل نشده، همه با همین کد وارد می‌شن.
        </p>
      )}

      {/*===== Thread List =====*/}
      <section
        ref={listRef}
        aria-labelledby="admin-sms-list"
        aria-busy={pending}
        className={cn("mt-5 scroll-mt-24 transition-opacity", pending && "opacity-60")}
      >
        <h2 id="admin-sms-list" className="sr-only">
          فهرست پیامک‌ها
        </h2>

        {total === 0 ? (
          /*------ Empty Kind ------*/
          <div key={viewKey} className={cn(moved && "answer-in")}>
            <AdminEmptyState title="از این نوع پیامی نرفته" icon={MessageSquareTextIcon}>
              بقیه‌ی پیام‌ها زیر «همه» هستن.
            </AdminEmptyState>
          </div>
        ) : (
          <div key={viewKey} className={cn(ADMIN_PLATE, "overflow-hidden")}>
            {days.map((group, groupIndex) => {
              const labelId = `admin-sms-day-${group.day}-${groupIndex}`;
              const labelRise = moved && riseIndex < STAGGERED ? riseIndex * RISE_STEP_S : null;

              return (
                <div key={`${group.day}-${groupIndex}`} className={cn(groupIndex > 0 && ["border-t", ADMIN_HAIRLINE])}>
                  {/*------ Day ------*/}
                  <p
                    id={labelId}
                    style={
                      labelRise !== null ? ({ "--answer-delay": `${labelRise}s` } as React.CSSProperties) : undefined
                    }
                    className={cn(
                      "px-4 pt-3.5 pb-0.5 text-xs font-bold text-muted-foreground sm:px-5 xl:px-6",
                      labelRise !== null && "answer-in",
                    )}
                  >
                    {describeDay({ day: group.day })}
                  </p>

                  {/*------ Messages ------*/}
                  <ol aria-labelledby={labelId} className={cn("divide-y", ADMIN_HAIRLINE)}>
                    {group.messages.map((message) => (
                      <SmsMessageRow
                        key={message.id}
                        message={message}
                        appOrigin={appOrigin}
                        showKind={kind === undefined}
                        rise={nextRise()}
                      />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/*===== Pages =====*/}
      {pageCount > 1 && (
        <Pagination
          className="mt-6"
          label="صفحه‌های پیامک‌ها"
          page={page - 1}
          pageCount={pageCount}
          onPick={(index) => {
            // Paging is the one change the Back button should undo, as on the catalogue.
            void navigate({
              search: (prev) => ({ ...prev, page: index === 0 ? undefined : index + 1 }),
              resetScroll: false,
            });
            scrollToList();
          }}
        />
      )}
    </div>
  );
}

/*===== Showcase Note =====*/
/** Why nothing here was really sent: a short dashed inset under the header, the slip's tear drawn round it. */
function ShowcaseNote() {
  return (
    <p
      className={cn(
        "mb-5 flex w-fit max-w-full items-start gap-2.5 rounded-2xl border px-4 py-2.5 text-sm leading-6 text-pretty text-muted-foreground",
        ADMIN_TEAR,
      )}
    >
      <MessageSquareDashedIcon aria-hidden strokeWidth={1.75} className="mt-0.5 size-4.5 shrink-0" />
      پیامک واقعی فرستاده نمی‌شه؛ هر پیامی که برنامه می‌فرسته این‌جا می‌مونه.
    </p>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay while the outbox is down.
function SmsError({ notFound }: { notFound: boolean }) {
  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "پیامک‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
