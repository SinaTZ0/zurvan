import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { isRouteErrorResponse, useLocation, useNavigation } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { createServerClient } from "~/orpc/server-client.server";

import { CollapsedPayment } from "./components/collapsed-payment";
import { FlagStrip } from "./components/flag-strip";
import { PaymentSlip } from "./components/payment-slip";
import { countByView, matchesView } from "./payment-views";
import type { Route } from "./+types/admin-payments";
import { PAGE_SIZE, paymentsSearchParams, type PaymentView } from "./search-params";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پرداخت‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The whole list, newest first, from the API. Filtering and paging happen in the component (URL state), so the loader
// doesn't read any search params.
export async function loader({ request }: Route.LoaderArgs) {
  const payments = await createServerClient(request).checkout.admin.payments({});

  return { payments };
}

/*===== Page =====*/
/**
 * F5's Admin ledger: every payment, with the items that were paid for but got no enrollment pulled to the top. The
 * Admin gives that money back outside the app; this page writes nothing.
 */
export default function AdminPaymentsPage({ loaderData }: Route.ComponentProps) {
  const { payments } = loaderData;

  /*------ URL State ------*/
  // Shallow: the list is already here, so a filter or a page only changes what is shown.
  const [{ view, page }, setParams] = useQueryStates(paymentsSearchParams, { shallow: true });

  /*------ Pending ------*/
  // Only a revalidation of this page dims the list; leaving for another Admin page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const pending = navigation.state !== "idle" && navigation.location?.pathname === location.pathname;

  /*------ Counts and Filter ------*/
  const counts = countByView(payments);
  const shown = payments.filter((payment) => matchesView(payment, view));

  /*------ Page ------*/
  // A page past the end (a filter that got narrower, or an old link) shows the last one.
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);
  const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const summary = `${formatNumberFa(counts.all)} پرداخت، ${formatNumberFa(counts.paid)} موفق`;

  /*------ Empty Ledger ------*/
  if (payments.length === 0) {
    return (
      <>
        <AdminPageHeader title="پرداخت‌ها" summary={summary} />
        <AdminEmptyState bubble="هنوز پرداختی نیست" title="پرداختی ثبت نشده">
          هر پرداختی که مشتری‌ها بکنند، با دوره‌هایش اینجا می‌آید.
        </AdminEmptyState>
      </>
    );
  }

  return (
    <>
      {/*===== Header =====*/}
      <AdminPageHeader title="پرداخت‌ها" summary={summary} />

      {/*===== Flag Strip =====*/}
      {counts.flagged > 0 && view !== "flagged" && (
        <FlagStrip payments={payments} onShow={() => setParams({ view: "flagged", page: null })} />
      )}

      {/*===== Filter =====*/}
      <AdminFilterPills<PaymentView>
        label="وضعیت"
        value={view}
        onChange={(next) => setParams({ view: next, page: null })}
        options={[
          { value: "all", label: "همه", count: counts.all },
          { value: "paid", label: "پرداخت‌شده", count: counts.paid },
          { value: "flagged", label: "بدون ثبت‌نام", count: counts.flagged },
          { value: "failed", label: "ناموفق", count: counts.failed },
          { value: "pending", label: "در انتظار", count: counts.pending },
        ]}
      />

      {/*===== Ledger =====*/}
      <div aria-busy={pending} className={cn("mt-4 flex flex-col gap-3", pending && "opacity-60")}>
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {view === "flagged" ? "همه‌ی پرداخت‌ها ثبت‌نام شده‌اند" : "موردی نیست"}
          </p>
        ) : (
          visible.map((payment) =>
            payment.status === "paid" ? (
              <PaymentSlip key={payment.id} payment={payment} />
            ) : (
              <CollapsedPayment key={payment.id} payment={payment} />
            ),
          )
        )}
      </div>

      {/*===== Pagination =====*/}
      {pageCount > 1 && (
        <Pagination
          className="mt-6"
          label="صفحه‌های پرداخت‌ها"
          page={current - 1}
          pageCount={pageCount}
          // Paging is the one change the Back button should undo, as on the catalogue.
          onPick={(index) => setParams({ page: index === 0 ? null : index + 1 }, { history: "push" })}
        />
      )}
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the shell stays usable while this list is down.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-payments-error-title" className="py-8">
      <h1 id="admin-payments-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "پرداخت‌ها باز نشدند"}
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
