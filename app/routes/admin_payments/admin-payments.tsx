import { createFileRoute } from "@tanstack/react-router";
import { cn } from "cn";
import { ReceiptTextIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { isRouteErrorResponse, useLocation, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { createServerClient } from "~/orpc/server-client.server";

import { CollapsedPayment } from "./components/collapsed-payment";
import { FlagPlate } from "./components/flag-plate";
import { PaymentSlip } from "./components/payment-slip";
import { PaymentsMotion } from "./components/payments-motion";
import { countByView, flagTotals, matchesView } from "./payment-views";
import type { Route } from "./+types/admin-payments";
import { PAGE_SIZE, paymentsSearchParams, type PaymentView } from "./search-params";

/*===== Constants =====*/
// A filter or a page change staggers only the first slips in; the rest of a long page is simply there.
const STAGGERED = 6;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پرداخت‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The whole list, newest first, from the API. Filtering and paging happen in the component (URL state), so the loader
// doesn't read any search params.
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [payments, refunds] = await Promise.all([client.checkout.admin.payments({}), client.refund.admin.list({})]);

  return { payments, refunds };
}

/*===== Page =====*/
/**
 * F5's Admin ledger: every payment as a slip, with the items that were paid for but got no enrollment drawn as the torn
 * piece and flagged at the top. Money is given back outside the app, but the decision, the amount, the transfer's
 * reference and who did it are recorded here: each paid slip ends on its refunds.
 */
export default function AdminPaymentsPage({ loaderData }: Route.ComponentProps) {
  const { payments, refunds } = loaderData;

  /*------ URL State ------*/
  // Shallow: the list is already here, so a filter or a page only changes what is shown.
  const [{ view, page }, setParams] = useQueryStates(paymentsSearchParams, { shallow: true });

  /*------ Pending ------*/
  // Only a reload of this page dims the list (a navigation to it, or the revalidation after a refund is answered);
  // leaving for another Admin page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const pending =
    revalidator.state === "loading" ||
    (navigation.state !== "idle" && navigation.location?.pathname === location.pathname);

  /*------ Counts and Filter ------*/
  const counts = countByView(payments);
  const shown = payments.filter((payment) => matchesView(payment, view));

  /*------ Page ------*/
  // A page past the end (a filter that got narrower, or an old link) shows the last one.
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);
  const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /*------ Motion ------*/
  // The slips rise in only once the filter or the page has changed (React's "adjust state on a prop change" pattern),
  // never on load. The ledger is keyed by the same pair, so each change replays the stagger.
  const listKey = `${view}:${current}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  const [moved, setMoved] = useState(false);
  if (listKey !== lastListKey) {
    setLastListKey(listKey);
    setMoved(true);
  }

  /*------ Pager Scroll ------*/
  // A new page starts at the ledger's top, under the sticky header (`scroll-mt-24`).
  const ledgerRef = useRef<HTMLDivElement>(null);
  function scrollToLedger() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ledgerRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  const summary = `${formatNumberFa(counts.all)} پرداخت، ${formatNumberFa(counts.paid)} موفق`;

  /*------ Empty Ledger ------*/
  if (payments.length === 0) {
    return (
      <>
        <AdminPageHeader title="پرداخت‌ها" summary={summary} />
        <AdminEmptyState title="پرداختی ثبت نشده" icon={ReceiptTextIcon}>
          هر پرداختی که مشتری‌ها بکنن، با دوره‌هاش اینجا میاد.
        </AdminEmptyState>
      </>
    );
  }

  return (
    <>
      <PaymentsMotion />

      {/*===== Header =====*/}
      <AdminPageHeader title="پرداخت‌ها" summary={summary} />

      {/*===== Flag =====*/}
      <FlagPlate
        visible={counts.flagged > 0 && view !== "flagged"}
        totals={flagTotals(payments)}
        onShow={() => setParams({ view: "flagged", page: null })}
      />

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
      <section
        ref={ledgerRef}
        aria-labelledby="admin-payments-ledger"
        aria-busy={pending}
        className={cn("mt-5 scroll-mt-24 transition-opacity", pending && "opacity-60")}
      >
        <h2 id="admin-payments-ledger" className="sr-only">
          دفتر پرداخت‌ها
        </h2>

        <div key={listKey} className="flex flex-col gap-4">
          {visible.length === 0 ? (
            /*------ Empty View ------*/
            <p
              className={cn(
                ADMIN_PLATE,
                "border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground shadow-none",
                moved && "answer-in",
              )}
            >
              {view === "flagged" ? "همه‌ی پرداخت‌ها ثبت‌نام شدن" : "موردی نیست"}
            </p>
          ) : (
            visible.map((payment, index) => {
              /*------ Stagger ------*/
              const rising = moved && index < STAGGERED;
              const motion = rising ? "answer-in" : undefined;
              const style = rising ? ({ "--answer-delay": `${index * 0.05}s` } as React.CSSProperties) : undefined;

              return payment.status === "paid" ? (
                <PaymentSlip
                  key={payment.id}
                  payment={payment}
                  refunds={refunds.filter((entry) => entry.paymentId === payment.id)}
                  className={motion}
                  style={style}
                />
              ) : (
                <CollapsedPayment key={payment.id} payment={payment} className={motion} style={style} />
              );
            })
          )}
        </div>
      </section>

      {/*===== Pagination =====*/}
      {pageCount > 1 && (
        <Pagination
          className="mt-8"
          label="صفحه‌های پرداخت‌ها"
          page={current - 1}
          pageCount={pageCount}
          // Paging is the one change the Back button should undo, as on the catalogue.
          onPick={(index) => {
            void setParams({ page: index === 0 ? null : index + 1 }, { history: "push" });
            scrollToLedger();
          }}
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
    <>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "پرداخت‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ size: "lg" })}>
        برگرد به نمای کلی
      </Link>
    </>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/admin/payments")({});
