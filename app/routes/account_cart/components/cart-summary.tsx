import { cn } from "cn";

import { FormAlert } from "~/components/form-alert";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Cart Summary =====*/
/**
 * «جمع سبد»: how many courses for how many dogs, the server's total, and the one main button. Only what can be paid is
 * counted; the note says how many are left out.
 *
 * `refreshing` is a removal's total on its way: the old total stays, dimmed, and «پرداخت» waits, so nobody pays a
 * number the page is about to change.
 */
export function CartSummary({
  courseCount,
  dogCount,
  unavailableCount,
  total,
  refreshing,
  busy,
  message,
  onPay,
}: {
  courseCount: number;
  dogCount: number;
  unavailableCount: number;
  /** Rial, from the server. */
  total: number;
  refreshing: boolean;
  /** Paying has started and the browser hasn't left yet. */
  busy: boolean;
  /** Why the last payment didn't start. */
  message: string | undefined;
  onPay: () => void;
}) {
  const nothingToPay = courseCount === 0;

  return (
    <section
      aria-labelledby="cart-summary-title"
      className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <h2 id="cart-summary-title" className="text-2xl font-extrabold">
        جمع سبد
      </h2>

      {/*------ Total ------*/}
      {!nothingToPay && (
        <p className="mt-3 text-muted-foreground">
          {formatNumberFa(courseCount)} دوره برای {formatNumberFa(dogCount)} سگ
        </p>
      )}
      <p
        aria-busy={refreshing}
        className={cn(
          "mt-2 text-3xl font-black transition-opacity motion-reduce:transition-none",
          nothingToPay ? "text-muted-foreground" : "text-primary",
          refreshing && "opacity-50",
        )}
      >
        {formatToman(nothingToPay ? 0 : total)}
      </p>
      {unavailableCount > 0 && (
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          {formatNumberFa(unavailableCount)} مورد توی این جمع حساب نشده، چون الان قابل پرداخت نیست.
        </p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">
        بعد از پرداخت، {HEAD_TRAINER.firstName} زنگ می‌زنه و با هم هماهنگ می‌کنیم.
      </p>

      {/*------ Actions ------*/}
      <div className="mt-6 flex flex-col gap-3">
        <FormAlert message={message} />
        <Button
          type="button"
          variant="solid"
          size="lg"
          disabled={nothingToPay || refreshing || busy}
          onClick={onPay}
          className="w-full"
        >
          {busy && <Spinner aria-hidden />}
          {busy ? "در حال رفتن به درگاه…" : nothingToPay ? "چیزی برای پرداخت نیست" : "پرداخت"}
        </Button>
        <Link to="/courses" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
          افزودن دوره‌ی دیگر
        </Link>
      </div>
    </section>
  );
}
