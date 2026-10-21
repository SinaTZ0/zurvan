import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { isRouteErrorResponse, useNavigate } from "react-router";

import { formatNumberFa } from "~/lib/digits";
import { requireSession } from "~/lib/session-guard.server";
import { CART_PATH } from "~/orpc/checkout/constants";
import { orpc } from "~/orpc/client";
import type { EvaluationPeriod, EvaluationWeekday } from "~/orpc/evaluation/constants";
import { groupByDog, selectCartItems, summarize } from "~/routes/account_cart/cart-groups";
import { COLUMN } from "~/routes/account_cart/column";
import { CartCounter } from "~/routes/account_cart/components/cart-counter";
import { CartError } from "~/routes/account_cart/components/cart-error";
import { CartHero } from "~/routes/account_cart/components/cart-hero";
import { CartPageError } from "~/routes/account_cart/components/cart-page-error";
import { CartSkeleton } from "~/routes/account_cart/components/cart-skeleton";
import { DogBag } from "~/routes/account_cart/components/dog-bag";
import { EmptyCart } from "~/routes/account_cart/components/empty-cart";
import { OrphanPlate } from "~/routes/account_cart/components/orphan-plate";
import { PageMotion } from "~/routes/account_cart/components/page-motion";
import { PaymentBanner } from "~/routes/account_cart/components/payment-banner";
import { WhenFree } from "~/routes/account_cart/components/when-free";
import { useCartItems } from "~/routes/account_cart/hooks/use-cart-items";
import { useCartPay } from "~/routes/account_cart/hooks/use-cart-pay";
import { useCartRemoval } from "~/routes/account_cart/hooks/use-cart-removal";
import { useCartReview } from "~/routes/account_cart/hooks/use-cart-review";
import { useFolding } from "~/routes/account_cart/hooks/use-folding";

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
 * F5's cart. The idea: the center's dog packs each dog's bag at the counter. The hero (he pushes the cart in), then
 * one bag per dog (its photo as a taped print, its bubble, its courses on a packing slip, the center's dog on the bag's
 * edge), the items that can't be matched to a dog, «کی هماهنگ کنیم؟», and the counter with the till (the server's total
 * and «پرداخت»), sticky beside the bags on a laptop. The gateway's result comes back as a banner, the page's one moment.
 * The review (prices, eligibility, total) comes from the server on the client, because the cart lives in the browser.
 */
export default function AccountCartPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, ready } = useCartItems();
  const review = useCartReview({ items, ready });
  const pay = useCartPay();

  /*------ Site Rules ------*/
  // Only when rules are published (`SITE_RULES`) and this customer hasn't accepted the version in force. The page waits
  // for the answer before «پرداخت» can be pressed, so a payment never starts on a guess.
  const consent = useQuery({ ...orpc.consent.status.queryOptions(), staleTime: 60_000, retry: 1 });
  const needsRules = consent.data?.siteRules != null && !consent.data.siteRules.accepted;
  const [rulesTicked, setRulesTicked] = useState(false);
  const { containerRef, remove, message: removalMessage } = useCartRemoval();

  /*------ When Free ------*/
  // Optional, for the call that arranges the lessons (F5). Sent with «پرداخت»; nothing is booked by it.
  const [availableDays, setAvailableDays] = useState<EvaluationWeekday[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<EvaluationPeriod[]>([]);

  /*------ Payment Result ------*/
  // Seeded once from the loader: the param is stripped below, so a refresh never shows the banner again, and the
  // banner survives the loader running again without it.
  const [payment] = useState(loaderData.payment);
  const handledPayment = useRef(false);

  useEffect(() => {
    if (!ready || !payment || handledPayment.current) return;
    handledPayment.current = true;

    // Only `paid` changes the cart, once: the server took the bought items out when the payment settled, so the cart is
    // read again (items added on another device since stay). `failed` leaves it exactly as it was.
    if (payment === "paid") void queryClient.invalidateQueries({ queryKey: orpc.cart.get.queryKey() });
    void navigate(CART_PATH, { replace: true, preventScrollReset: true });
  }, [ready, payment, queryClient, navigate]);

  /*------ Reviewed Items ------*/
  const reviewed = review.data ? selectCartItems({ reviewed: review.data.items, cart: items }) : [];
  const { groups, orphans } = groupByDog(reviewed);
  const summary = summarize(reviewed);
  // Removed rows and bags fold away instead of vanishing (`useFolding`).
  const bags = useFolding(groups, (group) => group.dog.id);
  const orphanPlates = useFolding(orphans.length > 0 ? [orphans] : [], () => "orphans");

  const loading = !ready || (items.length > 0 && !review.data && !review.isError);
  const failedToRead = ready && items.length > 0 && !review.data && review.isError;
  const empty = ready && items.length === 0;

  /*------ The Hero's Words ------*/
  const countLine =
    groups.length > 0
      ? `${formatNumberFa(reviewed.length)} دوره برای ${formatNumberFa(groups.length)} سگ توی سبدته؛ قیمت‌ها قیمت امروزن.`
      : `${formatNumberFa(items.length)} مورد توی سبدته.`;
  const hero =
    payment === "paid"
      ? { line: "دوره‌هایی که خریدی خودشون از سبد رفتن.", bubble: null }
      : loading
        ? { line: "قیمت‌ها و وضعیت هر مورد رو همین الان می‌خونیم.", bubble: null }
        : empty
          ? { line: "هنوز چیزی برنداشتی.", bubble: "سبدم خالیه! بریم یه دوره پیدا کنیم؟" }
          : failedToRead
            ? { line: countLine, bubble: null }
            : { line: countLine, bubble: "سبدت رو آوردم!" };

  return (
    <div className="overflow-x-clip">
      <PageMotion />

      {/*===== Hero =====*/}
      <CartHero line={hero.line} bubble={hero.bubble} stage={payment === null} />

      {/* Always mounted: a live region has to exist before its text changes to be announced. */}
      <output className="sr-only">{removalMessage}</output>

      <div className={`${COLUMN} pt-6 lg:pt-8`}>
        {/*===== Payment Banner =====*/}
        {payment && (
          <div className={payment === "failed" ? "mb-4 lg:mb-14" : "mb-6 lg:mb-8"}>
            <PaymentBanner result={payment} />
          </div>
        )}

        {/*===== Body =====*/}
        {/* Under «paid» the cart is being emptied, so the empty state would only contradict the banner. */}
        {payment === "paid" ? null : loading ? (
          <CartSkeleton />
        ) : failedToRead ? (
          <CartError onRetry={() => void review.refetch()} retrying={review.isFetching} />
        ) : empty ? (
          <EmptyCart />
        ) : (
          <div
            ref={containerRef}
            className="grid gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-10 xl:gap-x-14"
          >
            {/*------ Bags ------*/}
            <div className="flex min-w-0 flex-col gap-y-8">
              {bags.map((bag, index) => (
                <DogBag key={bag.key} group={bag.item} index={index} leaving={bag.leaving} onRemove={remove} />
              ))}
              {orphanPlates.map((plate) => (
                <OrphanPlate key={plate.key} items={plate.item} leaving={plate.leaving} onRemove={remove} />
              ))}
              <WhenFree
                days={availableDays}
                periods={availablePeriods}
                onDaysChange={setAvailableDays}
                onPeriodsChange={setAvailablePeriods}
              />
            </div>

            {/*------ Counter ------*/}
            <div className="min-w-0 lg:sticky lg:top-6">
              <CartCounter
                courseCount={summary.payable.length}
                dogCount={summary.dogCount}
                unavailableCount={summary.unavailableCount}
                total={review.data?.total ?? 0}
                depositPercent={review.data?.depositPercent ?? 100}
                dueNow={review.data?.dueNow ?? 0}
                refreshing={review.isPlaceholderData}
                busy={pay.busy || consent.isPending}
                paying={pay.busy}
                message={pay.message}
                needsRules={needsRules}
                rulesTicked={rulesTicked}
                onRulesTick={setRulesTicked}
                onPay={() =>
                  pay.start(
                    summary.payable.map(({ courseSlug, dogId }) => ({ courseSlug, dogId })),
                    { acceptRules: needsRules, availableDays, availablePeriods },
                  )
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <CartPageError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/account/cart")({});
