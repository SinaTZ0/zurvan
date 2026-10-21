import { cn } from "cn";
import { CheckCheckIcon, GraduationCapIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { isRouteErrorResponse, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { CustomerBlock, type LineMotion } from "~/routes/admin_enrollments/components/customer-block";
import { FinishDialog, type FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";
import { LEAVE_MS, PageMotion } from "~/routes/admin_enrollments/components/page-motion";
import { filterByStatus, groupByCustomer } from "~/routes/admin_enrollments/group-by-customer";
import { type LeavingLine, withLeavingLines } from "~/routes/admin_enrollments/leaving";
import {
  adminEnrollmentsSearchParams,
  ENROLLMENT_FILTERS,
  type EnrollmentFilter,
  PAGE_SIZE,
} from "~/routes/admin_enrollments/search-params";

import type { Route } from "./+types/admin-enrollments";

/*===== Constants =====*/
const FILTER_LABELS: Record<EnrollmentFilter, string> = {
  active: "در حال آموزش",
  completed: "تمام شد",
  cancelled: "لغو شد",
  all: "همه",
};

/** What a status filter says when it has no rows. «آموزش فعالی نیست» is the good news the Admin hopes for. */
const EMPTY_VIEWS: Record<EnrollmentFilter, { title: string; body?: string }> = {
  active: { title: "آموزش فعالی نیست", body: "همه‌ی آموزش‌ها بسته شدن. خرید بعدی که بیاد، این‌جا می‌بینیش." },
  completed: { title: "هنوز آموزشی تمام نشده" },
  cancelled: { title: "ثبت‌نامی لغو نشده" },
  all: { title: "موردی نیست" },
};

/** The stagger between blocks as a list arrives under a new filter or page; after the sixth they come together. */
const RISE_STEP_S = 0.06;
const MAX_STAGGERED = 5;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "ثبت‌نام‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. The whole list comes once (active first, then newest): the status filter, the counts, the
// grouping by customer and the paging are all applied in the component, so changing them never waits for the server.
export async function loader({ request }: Route.LoaderArgs) {
  return { enrollments: await createServerClient(request).enrollment.admin.list({}) };
}

/*===== Admin Enrollments =====*/
/**
 * F6 for the Admin: the call sheet. Customers are blocks (a person who bought two courses is dialled once) and each line
 * has the two endings, «تمام شد» and «لغو». The app only records: the call, the training and any money back happen
 * outside it.
 *
 * A line he closes doesn't just vanish when the list reloads: the page keeps a copy of it for under a second
 * (`leaving`), put back where it stood, so it can be stamped and fold away (and its block with it, if it was the last).
 */
export default function AdminEnrollmentsPage({ loaderData }: Route.ComponentProps) {
  const { enrollments } = loaderData;

  /*------ URL State ------*/
  const [{ status, page: requestedPage }, setParams] = useQueryStates(adminEnrollmentsSearchParams);

  /*------ Dialog ------*/
  // One dialog for every line. The target stays after closing so the exit animation keeps its words, and `session`
  // remounts the dialog for each opening so an old failure doesn't come back.
  const [target, setTarget] = useState<{ enrollment: AdminEnrollment; kind: FinishKind; session: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /*------ Pending ------*/
  const revalidator = useRevalidator();
  const pending = revalidator.state !== "idle";

  /*------ Leaving Lines ------*/
  const [leaving, setLeaving] = useState<LeavingLine[]>([]);
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

  /*------ List Arrival ------*/
  // Counts up on every filter or page change he makes, so the new list rises in (and never on load).
  const [arrival, setArrival] = useState(0);

  /*------ Counts ------*/
  const counts = useMemo(() => {
    const byStatus = { active: 0, completed: 0, cancelled: 0 };
    for (const enrollment of enrollments) byStatus[enrollment.status] += 1;
    return { ...byStatus, all: enrollments.length };
  }, [enrollments]);

  /*------ Lines and Blocks ------*/
  // `page` here is the requested one; a leaving line belongs to the page it was closed on.
  const viewLeaving = useMemo(
    () => leaving.filter((line) => line.filter === status && line.page === requestedPage),
    [leaving, status, requestedPage],
  );

  // «همه» keeps a closed line in the list (only its chip changes), so nothing is put back there.
  const lines = useMemo(() => {
    const shown = filterByStatus({ enrollments, status });
    return status === "all" ? shown : withLeavingLines({ lines: shown, leaving: viewLeaving });
  }, [enrollments, status, viewLeaving]);

  const blocks = useMemo(() => groupByCustomer(lines), [lines]);

  // A page past the end (an old link, or the last block just finished) shows the last one.
  const pageCount = Math.max(1, Math.ceil(blocks.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleBlocks = blocks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // In «همه» the closed line stays where it is and only its new chip is pressed in; elsewhere it leaves.
  const started = new Set(viewLeaving.filter((line) => line.batch !== undefined).map((line) => line.enrollment.id));
  const motion: LineMotion =
    status === "all"
      ? { leaving: new Map(), playing: new Set() }
      : { leaving: new Map(viewLeaving.map((line) => [line.enrollment.id, line.kind])), playing: started };
  const stamped = status === "all" ? started : new Set<string>();

  const listRef = useRef<HTMLDivElement>(null);

  /*------ Handlers ------*/
  /** Drops every kept line: a new view never shows another view's exit. */
  function changeView() {
    setLeaving([]);
    setArrival((previous) => previous + 1);
  }

  /** The API accepted an ending: keep the line, in its place, until its exit has played. */
  function keepLeavingLine({ enrollment, kind }: { enrollment: AdminEnrollment; kind: FinishKind }) {
    // Under reduced motion there is no exit to play: the reload simply takes the line away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const index = lines.findIndex((line) => line.id === enrollment.id);
    const before = lines
      .slice(0, Math.max(index, 0))
      .map((line) => line.id)
      // oxlint-disable-next-line unicorn/no-array-reverse -- a fresh array from `map`; the project's lib has no `toReversed`
      .reverse();
    setLeaving((previous) => [
      ...previous.filter((line) => line.enrollment.id !== enrollment.id),
      { enrollment, kind, filter: status, page: requestedPage, before },
    ]);
  }

  /** The dialog closed: the lines it ended start their exit now (not under its backdrop), and leave when it's done. */
  function closeDialog() {
    setDialogOpen(false);

    const batch = ++batchRef.current;
    setLeaving((previous) =>
      previous.some((line) => line.batch === undefined)
        ? previous.map((line) => (line.batch === undefined ? { ...line, batch } : line))
        : previous,
    );
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setLeaving((previous) => previous.filter((line) => line.batch !== batch));
    }, LEAVE_MS);
    timersRef.current.add(timer);
  }

  return (
    <div>
      <PageMotion />

      {/*===== Header =====*/}
      <AdminPageHeader
        title="ثبت‌نام‌ها"
        summary={counts.active > 0 ? `${formatNumberFa(counts.active)} آموزش در جریانه` : "آموزش فعالی نیست"}
      />

      {enrollments.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="ثبت‌نامی نیست" icon={GraduationCapIcon}>
          بعد از اولین پرداخت، آموزش‌ها این‌جا میان تا به صاحبشون زنگ بزنی.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Filter =====*/}
          {/* A count that changes under him pops inside the pills themselves. */}
          <div className="mb-5">
            <AdminFilterPills
              label="وضعیت"
              options={ENROLLMENT_FILTERS.map((value) => ({
                value,
                label: FILTER_LABELS[value],
                count: counts[value],
              }))}
              value={status}
              onChange={(next) => {
                if (next === status) return;
                changeView();
                void setParams({ status: next, page: null });
              }}
            />
          </div>

          {/*===== The Call Sheet =====*/}
          {/* Focusable so focus has somewhere to land when the line he just closed leaves. */}
          <div
            ref={listRef}
            tabIndex={-1}
            aria-busy={pending}
            aria-label="فهرست تماس‌ها"
            className={cn("scroll-mt-24 rounded-3xl transition-opacity outline-none", pending && "opacity-60")}
          >
            {blocks.length === 0 ? (
              <div key={arrival} className={cn(arrival > 0 && "answer-in")}>
                <AdminEmptyState title={EMPTY_VIEWS[status].title} icon={CheckCheckIcon}>
                  {EMPTY_VIEWS[status].body}
                </AdminEmptyState>
              </div>
            ) : (
              <ul key={arrival} className="-mb-4 flex flex-col">
                {visibleBlocks.map((block, index) => (
                  <CustomerBlock
                    key={block.customer.id}
                    block={block}
                    showBadge={status === "all"}
                    motion={motion}
                    stamped={stamped}
                    rise={arrival > 0 ? Math.min(index, MAX_STAGGERED) * RISE_STEP_S : null}
                    onFinish={({ enrollment, kind }) => {
                      setTarget((previous) => ({ enrollment, kind, session: (previous?.session ?? 0) + 1 }));
                      setDialogOpen(true);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          {/*===== Pages =====*/}
          {pageCount > 1 && (
            <Pagination
              label="صفحه‌های ثبت‌نام‌ها"
              page={page - 1}
              pageCount={pageCount}
              className="mt-6"
              onPick={(next) => {
                changeView();
                // Paging is the one change the Back button should undo.
                void setParams({ page: next === 0 ? null : next + 1 }, { history: "push" });
                listRef.current?.scrollIntoView({ block: "start" });
              }}
            />
          )}
        </>
      )}

      {/*===== Confirm =====*/}
      {target && (
        <FinishDialog
          key={target.session}
          open={dialogOpen}
          onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
          enrollment={target.enrollment}
          kind={target.kind}
          onConfirmed={keepLeavingLine}
          returnFocus={listRef}
        />
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "ثبت‌نام‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline", size: "default" })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
