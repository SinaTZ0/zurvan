import { Receipt, ReceiptTotal } from "~/components/receipt";
import { Stamp } from "~/components/stamp";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { CheckoutOrder } from "~/orpc/order/contract";
import { ResultLines } from "~/routes/account_payment_result/components/result-lines";

/*===== Paid Result =====*/
/**
 * The paid order: the receipt with the gold-leaf stamp on its corner (the page's one moment, so the button below is
 * the quiet kind), what the gateway says about the payment when it was paid online, and the next step in Arman's voice.
 */
export function PaidResult({ order }: { order: CheckoutOrder }) {
  const [item] = order.items;
  if (!item) return null;
  const payment = order.payment?.status === "succeeded" ? order.payment : null;
  const paidAt = payment?.paidAt ?? order.paidAt;

  return (
    <>
      {/* No `aside`: the stamp sits on that corner. The order number is in the page header. */}
      <Receipt title="رسید پرداخت">
        <Stamp lines={["پرداخت", "شد"]} />
        <ResultLines order={order} showWallet />

        <ReceiptTotal
          label="پرداخت آنلاین"
          amount={order.paidViaGateway}
          note={
            [
              order.paidViaGateway === 0 ? "همه‌ی مبلغ از کیف پولت رفت." : null,
              order.refundedAmount > 0
                ? `${formatToman(order.refundedAmount)} از این مبلغ به کیف پولت برگشته است.`
                : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />

        {/*------ Gateway Details ------*/}
        {(payment?.referenceId || payment?.cardNumberMasked || paidAt) && (
          <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-sm">
            {payment?.referenceId && (
              <>
                <dt className="text-muted-foreground">شماره‌ی پیگیری</dt>
                <dd className="font-bold tabular-nums">
                  <bdi dir="ltr">{payment.referenceId}</bdi>
                </dd>
              </>
            )}
            {payment?.cardNumberMasked && (
              <>
                <dt className="text-muted-foreground">کارت</dt>
                <dd className="font-bold tabular-nums">
                  <bdi dir="ltr">{payment.cardNumberMasked}</bdi>
                </dd>
              </>
            )}
            {paidAt && (
              <>
                <dt className="text-muted-foreground">زمان</dt>
                <dd className="font-bold">
                  {formatSlotDay(paidAt)}، {formatSlotTime(paidAt)}
                </dd>
              </>
            )}
          </dl>
        )}
      </Receipt>

      {/*------ Next Step ------*/}
      <section aria-labelledby="next-step-title" className="mt-8">
        <h2 id="next-step-title" className="text-lg font-extrabold">
          قدم بعدی
        </h2>
        <p className="mt-2 text-pretty text-muted-foreground">
          {item.kind === "test"
            ? `تست ${item.dog.name} ثبت شد. ظرف یکی دو روز تماس می‌گیرم تا وقت تست را بگذاریم.`
            : `${item.dog.name} ثبت شد. ظرف یکی دو روز تماس می‌گیرم تا وقت اولین جلسه را بگذاریم.`}
        </p>
        {item.enrollmentId && (
          <Link
            to={`/account/training/${item.enrollmentId}`}
            className={buttonVariants({ variant: "solid", size: "lg", className: "mt-5 px-8" })}
          >
            برو به آموزش {item.dog.name}
          </Link>
        )}
      </section>
    </>
  );
}
