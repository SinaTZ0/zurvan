import { Receipt, ReceiptTotal } from "~/components/receipt";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import type { CheckoutOrder } from "~/orpc/order/contract";
import { ResultLines } from "~/routes/account_payment_result/components/result-lines";

/*===== Failed Result =====*/
/**
 * The payment didn't go through and the order is still waiting: no stamp, the gateway's reason, what that means for the
 * customer's money, and the gold-leaf way back to Checkout (the page's one gold object).
 */
export function FailedResult({ order }: { order: CheckoutOrder }) {
  const reason = order.payment?.failureReason;

  return (
    <>
      <section
        aria-labelledby="failed-title"
        className="mb-6 rounded-2xl bg-destructive/10 p-5 ring-1 ring-destructive/30"
      >
        <h2 id="failed-title" className="text-lg font-extrabold text-destructive">
          پرداخت انجام نشد
        </h2>
        {reason && <p className="mt-1 text-pretty">{reason}</p>}
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          پولی از حسابت کم نشد؛ اگر کم شده، تا ۷۲ ساعت برمی‌گردد.
        </p>
      </section>

      <Receipt title="رسید پرداخت">
        <ResultLines order={order} showWallet={false} />
        <ReceiptTotal label="مبلغ سفارش" amount={order.totalAmount} />
      </Receipt>

      <Link to={`/account/checkout/${order.id}`} className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
        دوباره پرداخت کن
      </Link>
    </>
  );
}
