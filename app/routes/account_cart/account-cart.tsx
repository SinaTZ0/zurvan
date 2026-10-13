import { useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { isRouteErrorResponse, useNavigate } from "react-router";

import { clearCartAtom } from "~/atoms/cart";
import { ChalkDoodle } from "~/components/chalk-doodle";
import { DogEmptyState } from "~/components/dog-empty-state";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { requireSession } from "~/lib/session-guard.server";
import { CART_PATH } from "~/orpc/checkout/constants";
import { selectCartItems, groupByDog, summarize } from "~/routes/account_cart/cart-groups";
import { CartError } from "~/routes/account_cart/components/cart-error";
import { CartSkeleton } from "~/routes/account_cart/components/cart-skeleton";
import { CartSummary } from "~/routes/account_cart/components/cart-summary";
import { DogGroupCard } from "~/routes/account_cart/components/dog-group";
import { OrphanGroup } from "~/routes/account_cart/components/orphan-group";
import { PaymentBanner } from "~/routes/account_cart/components/payment-banner";
import { useCartItems } from "~/routes/account_cart/hooks/use-cart-items";
import { useCartPay } from "~/routes/account_cart/hooks/use-cart-pay";
import { useCartRemoval } from "~/routes/account_cart/hooks/use-cart-removal";
import { useCartReview } from "~/routes/account_cart/hooks/use-cart-review";

import type { Route } from "./+types/account-cart";

/*===== Guard =====*/
// Customers only: the cart is a customer's, and a partner has no dogs to buy for (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "سبد من | آموزش K9" }];

/*===== Loader =====*/
/**
 * Reads the gateway's `?payment=` result. The cart itself is in the browser, so there is nothing else to load; the
 * loader is also what makes the guard run on client-side navigations. Any value but `paid` and `failed` is ignored.
 */
export function loader({ request }: Route.LoaderArgs) {
  const payment = new URL(request.url).searchParams.get("payment");
  return { payment: payment === "paid" ? ("paid" as const) : payment === "failed" ? ("failed" as const) : null };
}

/*===== Cart =====*/
/**
 * F5's cart: each dog packs its own bag. Items are grouped by dog, every dog says what it's about to start, and the
 * summary has the total and «پرداخت». The review (prices, eligibility, total) comes from the server on the client,
 * because the cart lives in the browser.
 */
export default function AccountCartPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const clearCart = useSetAtom(clearCartAtom);
  const { items, ready } = useCartItems();
  const review = useCartReview({ items, ready });
  const pay = useCartPay();
  const { containerRef, remove, message: removalMessage } = useCartRemoval();

  /*------ Payment Result ------*/
  // Seeded once from the loader: the param is stripped below, so a refresh never shows the banner again, and the
  // banner survives the loader running again without it.
  const [payment] = useState(loaderData.payment);
  const handledPayment = useRef(false);

  useEffect(() => {
    if (!ready || !payment || handledPayment.current) return;
    handledPayment.current = true;

    // Only `paid` empties the cart, once: `failed` leaves it exactly as it was (the cart is a spec'd all-or-nothing).
    if (payment === "paid") clearCart();
    void navigate(CART_PATH, { replace: true, preventScrollReset: true });
  }, [ready, payment, clearCart, navigate]);

  /*------ Reviewed Items ------*/
  const reviewed = review.data ? selectCartItems({ reviewed: review.data.items, cart: items }) : [];
  const { groups, orphans } = groupByDog(reviewed);
  const summary = summarize(reviewed);

  const loading = !ready || (items.length > 0 && !review.data && !review.isError);
  const failedToRead = ready && items.length > 0 && !review.data && review.isError;

  return (
    <div className="site-container py-8 lg:py-14">
      {/*===== Header =====*/}
      <header className="mb-8 flex items-center gap-4 lg:mb-10">
        <h1 id="cart-title" tabIndex={-1} className="font-display text-h1 font-black text-balance outline-none">
          سبد من
        </h1>
        <ChalkDoodle name="bone" className="w-12 rotate-12 lg:w-14" />
      </header>

      {/* Always mounted: a live region has to exist before its text changes to be announced. */}
      <output className="sr-only">{removalMessage}</output>

      {/*===== Payment Banner =====*/}
      {payment && (
        <div className="mb-8 lg:mb-10">
          <PaymentBanner result={payment} />
        </div>
      )}

      {/*===== Body =====*/}
      {/* Under «paid» the cart is being emptied, so the empty state would only contradict the banner. */}
      {payment === "paid" ? null : loading ? (
        <CartSkeleton />
      ) : failedToRead ? (
        <CartError onRetry={() => void review.refetch()} retrying={review.isFetching} />
      ) : items.length === 0 ? (
        <DogEmptyState
          bubble="چیزی توی سبدم نیست! یه دوره برام پیدا کن"
          title="سبد خالیه"
          action={{ label: "دوره‌ها را ببین", to: "/#courses" }}
        >
          از صفحه‌ی هر دوره، سگت را انتخاب کن و «افزودن به سبد» را بزن.
        </DogEmptyState>
      ) : (
        <div
          ref={containerRef}
          className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8"
        >
          {/*------ Groups ------*/}
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <DogGroupCard key={group.dog.id} group={group} onRemove={remove} />
            ))}
            {orphans.length > 0 && <OrphanGroup items={orphans} onRemove={remove} />}
          </div>

          {/*------ Summary ------*/}
          <div className="lg:sticky lg:top-24">
            <CartSummary
              courseCount={summary.payable.length}
              dogCount={summary.dogCount}
              unavailableCount={summary.unavailableCount}
              total={review.data?.total ?? 0}
              refreshing={review.isPlaceholderData}
              busy={pay.busy}
              message={pay.message}
              onPay={() => pay.start(summary.payable.map(({ courseSlug, dogId }) => ({ courseSlug, dogId })))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="account-cart-error-title" className="site-container py-16">
      <h1 id="account-cart-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "سبدت باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به صفحه‌ی اصلی
      </Link>
    </section>
  );
}
