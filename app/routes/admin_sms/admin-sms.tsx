import { redirect, isRouteErrorResponse, useLocation, useNavigation } from "react-router";
import { useQueryStates } from "nuqs";
import { cn } from "cn";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa, toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { SHOWCASE_SIGN_IN_CODE } from "~/lib/user-constants";
import { createServerClient } from "~/orpc/server-client.server";
import { SMS_KIND_LABELS, SMS_KINDS, SMS_PAGE_SIZE, type SmsKind } from "~/orpc/sms/constants";

import { SmsMessageRow } from "./components/sms-message-row";
import type { Route } from "./+types/admin-sms";
import { loadSmsSearchParams, smsSearchParams } from "./search-params";

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
  };
}

/*===== Helpers =====*/
function sumCounts(counts: Partial<Record<SmsKind, number>>): number {
  return Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
}

/*===== Page =====*/
/**
 * Every message the app would have sent. Showcase mode sends none, so this is where the Admin sees them: a read-only
 * list, newest first, paged on the server. Nothing here is resent or deleted.
 */
export default function AdminSmsPage({ loaderData }: Route.ComponentProps) {
  const { kind, page, pageCount, items, total, kindCounts, allTotal, newest } = loaderData;

  /*------ URL State ------*/
  // Not shallow: the loader reads both params. Changing the kind starts again on the first page.
  const [, setParams] = useQueryStates(smsSearchParams);

  /*------ Pending ------*/
  // Only a change to this page's own URL dims the list; leaving for another Admin page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const pending = navigation.state !== "idle" && navigation.location?.pathname === location.pathname;

  /*------ Summary ------*/
  const summary =
    newest === null
      ? "هنوز پیامی نرفته"
      : `${formatNumberFa(allTotal)} پیام؛ تازه‌ترینش ${formatJalaliTimestamp(newest)}`;

  /*------ Empty Outbox ------*/
  if (newest === null) {
    return (
      <>
        <AdminPageHeader title="پیامک‌ها" summary={summary} />
        <p className="mb-5 text-sm text-pretty text-muted-foreground">
          پیامک واقعی فرستاده نمی‌شود؛ هر پیامی که برنامه می‌فرستاد، اینجا می‌ماند.
        </p>
        <AdminEmptyState bubble="هنوز نفرستاده‌ام" title="پیامکی نرفته">
          وقتی کسی کد ورود بخواهد یا خریدی انجام شود، پیامش اینجا می‌آید.
        </AdminEmptyState>
      </>
    );
  }

  /*------ Kind Pills ------*/
  // Only kinds that have rows get a pill; the order is the constant's, so the list reads the same every time.
  const kindOptions = SMS_KINDS.filter((value) => (kindCounts[value] ?? 0) > 0).map((value) => ({
    value,
    label: SMS_KIND_LABELS[value],
    count: kindCounts[value] ?? 0,
  }));

  return (
    <>
      {/*===== Header =====*/}
      <AdminPageHeader title="پیامک‌ها" summary={summary} />
      <p className="mb-5 text-sm text-pretty text-muted-foreground">
        پیامک واقعی فرستاده نمی‌شود؛ هر پیامی که برنامه می‌فرستاد، اینجا می‌ماند.
      </p>

      {/*===== Filter =====*/}
      <AdminFilterPills<SmsKind | "all">
        label="نوع پیام"
        value={kind ?? "all"}
        onChange={(next) => setParams({ kind: next === "all" ? null : next, page: null })}
        options={[{ value: "all", label: "همه", count: allTotal }, ...kindOptions]}
      />
      {kind === "sign-in-code" && (
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          کد همه‌ی پیام‌های ورود {toPersianDigits(SHOWCASE_SIGN_IN_CODE)} است؛ تا وقتی پیامک واقعی وصل نشده، همه با همین
          کد وارد می‌شوند.
        </p>
      )}

      {/*===== Inbox =====*/}
      <div aria-busy={pending} className={cn("mt-4", pending && "opacity-60")}>
        {total === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            پیامی از این نوع نیست.
          </p>
        ) : (
          <ol>
            {items.map((message) => (
              <SmsMessageRow
                key={message.id}
                phoneNumber={message.phoneNumber}
                kind={message.kind}
                body={message.body}
                createdAt={message.createdAt}
              />
            ))}
          </ol>
        )}
      </div>

      {/*===== Pagination =====*/}
      {pageCount > 1 && (
        <Pagination
          className="mt-6 justify-start"
          label="صفحه‌های پیامک‌ها"
          page={page - 1}
          pageCount={pageCount}
          // Paging is the one change the Back button should undo, as on the catalogue.
          onPick={(index) => setParams({ page: index === 0 ? null : index + 1 }, { history: "push" })}
        />
      )}
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the shell stays usable while the outbox is down.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-sms-error-title" className="py-8">
      <h1 id="admin-sms-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "پیامک‌ها باز نشد"}
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
