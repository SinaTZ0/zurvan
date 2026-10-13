import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { AdminPayment } from "~/orpc/checkout/contract";

/*===== Flag Strip =====*/
/**
 * The first thing the Admin sees when money arrived without a course: how many items, and what they cost together. It
 * is not an alarm (no icon): the strip is tinted, and «ببین» opens the flagged view. Hidden inside that view.
 */
export function FlagStrip({
  payments,
  onShow,
}: {
  /** The whole list, not the filtered one: the strip counts every flagged item. */
  payments: readonly AdminPayment[];
  onShow: () => void;
}) {
  /*------ Totals ------*/
  const flaggedItems = payments.flatMap((payment) => payment.items.filter((item) => item.paidNotEnrolled));
  const count = payments.reduce((sum, payment) => sum + payment.paidNotEnrolledCount, 0);
  const total = flaggedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
      <p className="text-sm font-bold text-pretty">
        {formatNumberFa(count)} مورد پرداخت شده ولی ثبت‌نام نشده · {formatToman(total)}
      </p>
      <Button variant="outline" size="sm" onClick={onShow}>
        ببین
      </Button>
    </div>
  );
}
