import { ORPCError } from "@orpc/client";
import { data, redirect } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { env } from "~/env.server";
import { sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { CheckoutPanel, OrderNumber } from "~/routes/account_checkout/components/checkout-panel";
import { ClosedOrder } from "~/routes/account_checkout/components/closed-order";
import { NotCustomerPanel } from "~/routes/account_checkout/components/not-customer-panel";
import type { DeskRouteHandle } from "~/routes/layout_account/components/bottom-tabs";

import type { Route } from "./+types/account-checkout";

/*===== Handle =====*/
// A focused step with its own fixed bar on phones, so the account's bottom tabs step aside.
export const handle: DeskRouteHandle = { hideBottomTabs: true };

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "پرداخت | آموزش K9" }];

/*===== Loader =====*/
// The account guard lets trainers and partners in too, and orders are the customer's own: they get a short panel.
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  if (user.role !== "customer") return { kind: "other" as const, isTrainer: user.role === "trainer" };

  const order = await createServerClient(request)
    .order.get({ id: params.orderId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });

  // Paid (even if partly refunded since) has nothing left to do here; the result page is its receipt.
  if (order.status === "paid" || order.status === "refunded" || order.status === "partially-refunded") {
    throw redirect(`/account/checkout/${order.id}/result`);
  }

  return { kind: "order" as const, order, showcase: env.SHOWCASE_MODE };
}

/*===== Page =====*/
export default function CheckoutPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="site-container py-8 pb-40 md:pb-12 lg:py-12">
      <div className="mx-auto max-w-xl">
        {loaderData.kind === "other" ? (
          <NotCustomerPanel isTrainer={loaderData.isTrainer} />
        ) : (
          <>
            {/*===== Header =====*/}
            <header className="mb-6 flex items-baseline justify-between gap-4">
              <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">پرداخت</h1>
              <p className="text-sm text-muted-foreground">
                <OrderNumber number={loaderData.order.number} />
              </p>
            </header>

            {loaderData.order.status === "pending" ? (
              <CheckoutPanel order={loaderData.order} showcase={loaderData.showcase} />
            ) : (
              <ClosedOrder order={loaderData.order} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the tabs and the way out stay on screen.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="checkout-error-title" className="site-container py-16">
      <h1 id="checkout-error-title" className="text-2xl font-extrabold">
        این سفارش پیدا نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        سفارش پیدا نشد یا مشکلی پیش آمد. دوره‌هایت را در «آموزش‌ها» ببین یا دوباره امتحان کن.
      </p>
      <Link to="/account/training" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        آموزش‌ها
      </Link>
    </section>
  );
}
