import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import type { CheckoutOrder } from "~/orpc/order/contract";

/*===== Waiting Result =====*/
/**
 * The order is still unpaid and the gateway has not said it failed (the customer came back without finishing, or the
 * callback is still being settled). Nothing happened yet, so the page says so and offers Checkout, quietly.
 */
export function WaitingResult({ order }: { order: CheckoutOrder }) {
  return (
    <section aria-labelledby="waiting-title" className="rounded-3xl bg-sunken p-6 lg:p-8">
      <h2 id="waiting-title" className="text-lg font-extrabold">
        هنوز پرداختی ثبت نشده
      </h2>
      <p className="mt-2 text-pretty text-muted-foreground">
        اگر همین الان پرداخت کردی، چند لحظه صبر کن و صفحه را تازه کن. اگر نه، از همان‌جا که بودی ادامه بده.
      </p>
      <Link
        to={`/account/checkout/${order.id}`}
        className={buttonVariants({ variant: "solid", size: "lg", className: "mt-6 px-8" })}
      >
        برو به پرداخت
      </Link>
    </section>
  );
}
