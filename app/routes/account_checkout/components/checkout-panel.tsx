import { ORPCError } from "@orpc/client";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Receipt, ReceiptLine, ReceiptLines, ReceiptTotal } from "~/components/receipt";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { describeApiFailure } from "~/lib/api-error";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { errorDataSchema } from "~/orpc/errors";
import type { CheckoutOrder } from "~/orpc/order/contract";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";
import { AppliedCode, DiscountRow } from "~/routes/account_checkout/components/discount-row";
import { WalletRow } from "~/routes/account_checkout/components/wallet-row";
import { usePayOrder } from "~/routes/account_checkout/hooks/use-checkout-actions";
import { useCountingAmount } from "~/routes/account_checkout/hooks/use-counting-amount";
import { describeRefund } from "~/routes/account_checkout/refund-sentence";

const LINE_ENTER =
  "motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-top-2";

/*===== Checkout Panel =====*/
/**
 * The receipt to pay: the item, the code, the wallet and the total, then the refund sentence and the gold-leaf
 * button. The amounts shown are exactly what `order.pay` will take: the wallet first, capped at the total, and the
 * rest online. Phones carry the button in a fixed bar with its amount; from `md` up it sits under the receipt, so
 * there is never a second gold button on screen.
 */
export function CheckoutPanel({ order, showcase }: { order: CheckoutOrder; showcase: boolean }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const pay = usePayOrder();
  const [useWallet, setUseWallet] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const [item] = order.items;
  const hasWallet = order.walletBalance > 0;
  const fromWallet = useWallet && hasWallet ? Math.min(order.walletBalance, order.totalAmount) : 0;
  const online = order.totalAmount - fromWallet;
  const shownOnline = useCountingAmount(online);
  // Kept busy after success too: the page is on its way to the gateway or the result.
  const busy = pay.isPending || pay.isSuccess;
  const buttonLabel = online === 0 ? "پرداخت از کیف پول" : `پرداخت ${formatToman(online)}`;

  const onPay = () => {
    setProblem(null);
    pay.mutate(
      { id: order.id, useWallet: useWallet && hasWallet },
      {
        onSuccess: async (result) => {
          if (result.kind === "paid") {
            await navigate(`/account/checkout/${order.id}/result`, { viewTransition: true });
            return;
          }
          // The gateway is another site (or, in the demo, a resource route that redirects): a full navigation.
          window.location.assign(result.url);
        },
        onError: async (error) => {
          if (error instanceof ORPCError && error.code === "NOT_PAYABLE") {
            const parsed = errorDataSchema.safeParse(error.data);
            setProblem(parsed.success ? (parsed.data.errors[0] ?? null) : null);
            // The order may have changed (a code lapsed, the total moved): show it as it is now.
            await revalidator.revalidate();
            return;
          }
          setProblem(describeApiFailure({ error, fallback: "پرداخت شروع نشد. دوباره امتحان کن." }).message);
        },
      },
    );
  };

  if (!item) return null;

  const isTest = item.kind === "test";
  const coursePrice = item.unitPrice - item.boardingPrice;
  const place = item.boarding ? "پانسیون" : (item.address ?? "");
  // A behavior plan was written by the trainer for this dog: the booking form can't change it, so «تغییر» becomes a
  // way back to the plan itself.
  const isPlan = item.behaviorRequestId !== null;
  const changeHref = isPlan
    ? "/account/behavior-requests"
    : `/account/book/${item.course.slug}?${isTest ? "kind=test&" : ""}dog=${item.dog.id}`;
  const onNotPayable = (message: string) => setProblem(message || "این سفارش تغییر کرده؛ مبلغ را دوباره نگاه کن.");

  return (
    <>
      <Receipt title="رسید پرداخت">
        <ReceiptLines>
          {/*------ Dog ------*/}
          <ReceiptLine label="سگ">
            <span className="flex items-center gap-3">
              <DogThumb dog={item.dog} />
              <span className="min-w-0 truncate text-lg font-extrabold">{item.dog.name}</span>
            </span>
          </ReceiptLine>

          {/*------ Course ------*/}
          <ReceiptLine label={isTest ? "تست" : "دوره"} amount={coursePrice}>
            <span className="block text-pretty">
              {item.course.title}
              {item.planSessions !== null && ` · برنامه‌ی ${formatNumberFa(item.planSessions)} جلسه‌ای`}
            </span>
          </ReceiptLine>

          {/*------ Boarding ------*/}
          {item.boarding && (
            <ReceiptLine label="پانسیون" amount={item.boardingPrice}>
              سگ در پانسیون می‌ماند
            </ReceiptLine>
          )}

          {/*------ Place and Times ------*/}
          {/* Its own full-width row: beside the price, a long address would be squeezed into a narrow column. */}
          <div className="py-3">
            <dt className="sr-only">جزئیات رزرو</dt>
            <dd className="text-sm text-pretty text-muted-foreground">
              {place}
              {place && "، "}
              {item.preferredTimes}
              <Link
                to={changeHref}
                className="ms-3 inline-block rounded-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                {isPlan ? "برنامه‌ی آرمان" : "تغییر"}
                {!isPlan && <span className="sr-only"> مشخصات رزرو</span>}
              </Link>
            </dd>
          </div>

          {/*------ Discount ------*/}
          {order.discountCode ? (
            <div className={LINE_ENTER}>
              <ReceiptLine label="تخفیف" credit amount={order.discountAmount}>
                <AppliedCode orderId={order.id} code={order.discountCode} onNotPayable={onNotPayable} />
              </ReceiptLine>
            </div>
          ) : (
            <DiscountRow orderId={order.id} onNotPayable={onNotPayable} />
          )}

          {/*------ Wallet ------*/}
          {hasWallet && <WalletRow balance={order.walletBalance} checked={useWallet} onCheckedChange={setUseWallet} />}
          {fromWallet > 0 && (
            <div className={LINE_ENTER}>
              <ReceiptLine label="کیف پول" credit amount={fromWallet}>
                از کیف پول
              </ReceiptLine>
            </div>
          )}
        </ReceiptLines>

        {/*------ Total ------*/}
        <ReceiptTotal
          label="پرداخت آنلاین"
          amount={shownOnline}
          note={online === 0 ? "پرداخت آنلاین لازم نیست." : undefined}
        />

        {/*------ Refund, Problem and Button ------*/}
        <p className="mt-5 text-sm text-pretty text-muted-foreground">
          {describeRefund({ kind: item.kind, percent: item.refundPolicy.percent })}{" "}
          <Link to="/help/refunds" className="rounded-sm font-bold text-primary underline-offset-4 hover:underline">
            قوانین لغو و بازپرداخت
          </Link>
        </p>
        <div className="mt-4 hidden flex-col gap-3 md:flex">
          <FormAlert message={problem ?? undefined} />
          <PayButton label={buttonLabel} busy={busy} onClick={onPay} />
          {showcase && <ShowcaseNote />}
        </div>
      </Receipt>

      {/*------ Phone Bar ------*/}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-popover/95 pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg backdrop-blur-md md:hidden">
        <div className="site-container flex flex-col gap-2 py-3">
          <FormAlert message={problem ?? undefined} />
          <PayButton label={buttonLabel} busy={busy} onClick={onPay} />
          {showcase && <ShowcaseNote />}
        </div>
      </div>
    </>
  );
}

/*===== Pieces =====*/
/** The order number as the paper trail writes it: Latin, left to right. */
export function OrderNumber({ number }: { number: string }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {number}
    </span>
  );
}

function PayButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="lg" disabled={busy} onClick={onClick} className="w-full">
      {busy && <Spinner data-icon="inline-start" />}
      {label}
    </Button>
  );
}

function ShowcaseNote() {
  return <p className="text-center text-sm text-muted-foreground">نسخه‌ی نمایشی: پرداخت بدون درگاه انجام می‌شود.</p>;
}
