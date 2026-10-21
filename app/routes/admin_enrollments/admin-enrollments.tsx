import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { useMemo, useRef, useState } from "react";
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
import { CustomerBlock } from "~/routes/admin_enrollments/components/customer-block";
import { FinishDialog, type FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";
import { filterByStatus, groupByCustomer } from "~/routes/admin_enrollments/group-by-customer";
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
const EMPTY_LINES: Record<EnrollmentFilter, string> = {
  active: "آموزش فعالی نیست",
  completed: "موردی نیست",
  cancelled: "موردی نیست",
  all: "موردی نیست",
};

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

  /*------ Counts ------*/
  const counts = useMemo(() => {
    const byStatus = { active: 0, completed: 0, cancelled: 0 };
    for (const enrollment of enrollments) byStatus[enrollment.status] += 1;
    return { ...byStatus, all: enrollments.length };
  }, [enrollments]);

  /*------ Blocks ------*/
  const blocks = useMemo(() => groupByCustomer(filterByStatus({ enrollments, status })), [enrollments, status]);

  // A page past the end (an old link, or the last block just finished) shows the last one.
  const pageCount = Math.max(1, Math.ceil(blocks.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleBlocks = blocks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="ثبت‌نام‌ها"
        summary={counts.active > 0 ? `${formatNumberFa(counts.active)} آموزش در حال انجام است` : "آموزش فعالی نیست"}
      />

      {enrollments.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="ثبت‌نامی نیست">
          بعد از اولین پرداخت، آموزش‌ها اینجا می‌آیند تا به صاحبشان زنگ بزنی.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Filter =====*/}
          <AdminFilterPills
            label="وضعیت"
            options={ENROLLMENT_FILTERS.map((value) => ({ value, label: FILTER_LABELS[value], count: counts[value] }))}
            value={status}
            onChange={(next) => setParams({ status: next, page: null })}
            className="mb-5"
          />

          {/*===== The Call Sheet =====*/}
          <div
            ref={listRef}
            aria-busy={pending}
            className={cn("scroll-mt-24 transition-opacity", pending && "opacity-60")}
          >
            {blocks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                {EMPTY_LINES[status]}
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {visibleBlocks.map((block) => (
                  <CustomerBlock
                    key={block.customer.id}
                    block={block}
                    showBadge={status === "all"}
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
          onOpenChange={setDialogOpen}
          enrollment={target.enrollment}
          kind={target.kind}
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
    <section aria-labelledby="admin-enrollments-error-title">
      <h1 id="admin-enrollments-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "ثبت‌نام‌ها باز نشدند"}
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
