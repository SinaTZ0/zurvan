import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Commission Summary =====*/
/**
 * What is owed and what was paid, in Toman, with the rule that sets the percent. The Admin pays by bank transfer and
 * texts the partner, which is why the line says so: a partner shouldn't wonder when the money comes.
 */
export function CommissionSummary({
  unpaidAmount,
  paidAmount,
  commissionPercent,
}: {
  /** Rial, not yet paid. */
  unpaidAmount: number;
  /** Rial, already paid. */
  paidAmount: number;
  commissionPercent: number;
}) {
  const figures = [
    { label: "منتظر پرداخت", value: unpaidAmount },
    { label: "پرداخت‌شده", value: paidAmount },
  ];

  return (
    <section aria-labelledby="partner-commission-title" className="flex flex-col gap-4">
      <h2 id="partner-commission-title" className="font-display text-2xl font-black">
        پورسانت‌هایت
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {figures.map((figure) => (
          <div key={figure.label} className="min-w-0 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{figure.label}</p>
            <p className="mt-2 text-xl font-extrabold break-words sm:text-2xl">{formatToman(figure.value)}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-pretty text-muted-foreground">
        از اولین خرید هر مشتری {formatNumberFa(commissionPercent)}٪ می‌گیری. {HEAD_TRAINER.firstName} آن را بانکی پرداخت
        می‌کند و به تو پیامک می‌دهد.
      </p>
    </section>
  );
}
