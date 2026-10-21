import { cn } from "cn";
import { MessageSquareDashedIcon, MessageSquareTextIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo, useRef, useState } from "react";
import { isRouteErrorResponse, redirect, useLocation, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { env } from "~/env.server";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { SHOWCASE_SIGN_IN_CODE } from "~/lib/user-constants";
import { createServerClient } from "~/orpc/server-client.server";
import { SMS_KIND_LABELS, SMS_KINDS, SMS_PAGE_SIZE, type SmsKind } from "~/orpc/sms/constants";
import { SmsMessageRow } from "~/routes/admin_sms/components/sms-message-row";
import { describeDay } from "~/routes/admin_sms/dates";
import { groupByDay } from "~/routes/admin_sms/day-groups";
import { loadSmsSearchParams, smsSearchParams } from "~/routes/admin_sms/search-params";

import type { Route } from "./+types/admin-sms";

/*===== Constants =====*/
/** A list that arrived under a new kind or page staggers its first rows in; the rest of the page is simply there. */
const STAGGERED = 6;
const RISE_STEP_S = 0.05;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پیامک‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The outbox grows with every sign-in code, so the API pages it. A page past the end (an old link, or a filter that got
// narrower) is redirected to the last page, so the URL always shows what the list shows.
export async function loader({ request }: Route.LoaderArgs) {
  const { kind, page } = loadSmsSearchParams(request);
  const sms = createServerClient(request).sms.admin;

  const list = await sms.list({ kind: kind ?? undefined, page: Math.max(page - 1, 0) });

  const pageCount = Math.max(1, Math.ceil(list.total / SMS_PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);

  if (current !== page) {
    const url = new URL(request.url);
    if (current === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(current));
    throw redirect(`${url.pathname}${url.search}`);
  }

  /*------ Summary ------*/
  // The header counts every message and shows the newest of them, so a filtered or later page asks for the first page
  // of the whole outbox once more.
  // The unfiltered list's counts are the same whatever the filter, so `list.kindCounts` is the whole outbox's count.
  const everything = kind === null && current === 1 ? list : await sms.list({ page: 0 });
  const allTotal = sumCounts(list.kindCounts);

  return {
    kind,
    page: current,
    pageCount,
    items: list.items,
    total: list.total,
    kindCounts: list.kindCounts,
    allTotal,
    newest: everything.items[0]?.createdAt ?? null,
    // The links the app writes into its own messages start with this, so a bubble can open them here.
    appOrigin: new URL(env.BETTER_AUTH_URL).origin,
  };
}

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
 * Motion only answers him: a new kind or page makes the first rows rise in. Nothing moves on load or on a revalidation.
 */
export default function AdminSmsPage({ loaderData }: Route.ComponentProps) {
  const { kind, page, pageCount, items, total, kindCounts, allTotal, newest, appOrigin } = loaderData;

  /*------ URL State ------*/
  // Not shallow: the loader reads both params. Changing the kind starts again on the first page.
  const [, setParams] = useQueryStates(smsSearchParams);

  /*------ Pending ------*/
  // A change to this page's own URL or a revalidation dims the list; leaving for another Admin page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const pending =
    revalidator.state === "loading" ||
    (navigation.state !== "idle" && navigation.location?.pathname === location.pathname);

  /*------ Days ------*/
  const days = useMemo(() => groupByDay(items), [items]);

  /*------ Motion ------*/
  // The rows rise in once the kind or the page has changed (React's "adjust state on a prop change" pattern), never on
  // load. Keyed by the view, not by the rows, so a new message arriving on a revalidation moves nothing.
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
        onChange={(next) => void setParams({ kind: next === "all" ? null : next, page: null })}
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
                        showKind={kind === null}
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
            void setParams({ page: index === 0 ? null : index + 1 }, { history: "push" });
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
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

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
