import { ORPCError } from "@orpc/client";
import { data, redirect } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { FailedResult } from "~/routes/account_payment_result/components/failed-result";
import { LostResult } from "~/routes/account_payment_result/components/lost-result";
import { PaidResult } from "~/routes/account_payment_result/components/paid-result";
import { WaitingResult } from "~/routes/account_payment_result/components/waiting-result";
import { getResultState } from "~/routes/account_payment_result/result-state";

import type { Route } from "./+types/account-payment-result";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "نتیجه‌ی پرداخت | آموزش K9" }];

/*===== Loader =====*/
// Where the gateway callback lands. The callback needs no session, so this page checks who is looking: `order.get`
// answers NOT_FOUND for anyone else's order.
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  if (user.role !== "customer") throw redirect("/account");

  const order = await createServerClient(request)
    .order.get({ id: params.orderId })
    .catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    });

  const state = getResultState(order);
  // Cancelled with nothing paid: Checkout has the page for that.
  if (state === "closed") throw redirect(`/account/checkout/${order.id}`);

  return { order, state };
}

/*===== Page =====*/
export default function PaymentResultPage({ loaderData }: Route.ComponentProps) {
  const { order, state } = loaderData;
  const title = "نتیجه‌ی پرداخت";

  return (
    <div className="site-container overflow-x-clip py-8 lg:py-12">
      <div className="mx-auto max-w-xl">
        {/*===== Header =====*/}
        <header className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            <span dir="ltr" className="tabular-nums">
              {order.number}
            </span>
          </p>
        </header>

        {state === "paid" && <PaidResult order={order} />}
        {state === "failed" && <FailedResult order={order} />}
        {state === "lost" && <LostResult order={order} />}
        {state === "waiting" && <WaitingResult order={order} />}
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the tabs and the way out stay on screen.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="result-error-title" className="site-container py-16">
      <h1 id="result-error-title" className="text-2xl font-extrabold">
        این سفارش پیدا نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        اگر همین الان پرداخت کرده‌ای، نگران نباش: آموزش‌هایت را ببین و اگر نبود، با ما تماس بگیر.
      </p>
      <Link to="/account/training" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
        آموزش‌ها
      </Link>
    </section>
  );
}
