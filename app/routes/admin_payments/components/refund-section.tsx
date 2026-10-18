import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { sumStanding } from "~/lib/refund-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import { REFUND_STATUS_LABELS } from "~/orpc/refund/constants";
import type { Refund } from "~/orpc/refund/contract";

import { CreateRefundDialog } from "./create-refund-dialog";
import { CancelRefundDialog, MarkRefundPaidDialog } from "./refund-answer-dialogs";

/*===== Refund Section =====*/
/**
 * The refunds of one paid payment (docs/app-spec.md, F5): what can still be given back, each refund with its state,
 * reason and transfer reference, «پرداخت شد» and «لغو» on a pending one, and «ثبت بازپرداخت» to record a new one. Every
 * step asks first or says what it did; nothing here moves money, which is sent outside the app.
 */
export function RefundSection({ payment, refunds }: { payment: AdminPayment; refunds: readonly Refund[] }) {
  const remaining = payment.amount - sumStanding(refunds);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<Refund | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Refund | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <section aria-label="بازپرداخت‌ها" className="border-t border-dashed border-border px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm font-bold">
          بازپرداخت‌ها
          <span className="ms-2 text-xs font-normal text-muted-foreground">
            {remaining > 0 ? `قابل بازپرداخت: ${formatToman(remaining)}` : "چیزی برای بازپرداخت نمانده"}
          </span>
        </p>
        <Button type="button" variant="outline" size="sm" disabled={remaining <= 0} onClick={() => setCreating(true)}>
          ثبت بازپرداخت
        </Button>
      </div>

      {refunds.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {refunds.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums">
                  {formatToman(entry.amount)}
                  <span className="ms-2 rounded-full border border-border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {REFUND_STATUS_LABELS[entry.status]}
                  </span>
                </p>
                <p className="text-xs text-pretty text-muted-foreground">
                  {entry.reason} · {formatJalaliTimestamp(entry.createdAt)}
                  {entry.reference && (
                    <>
                      {" "}
                      · کد پیگیری <bdi dir="ltr">{entry.reference}</bdi>
                    </>
                  )}
                </p>
              </div>
              {entry.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPaying(entry);
                      setPayOpen(true);
                    }}
                  >
                    پرداخت شد
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelling(entry);
                      setCancelOpen(true);
                    }}
                  >
                    لغو
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <CreateRefundDialog payment={payment} remaining={remaining} open={creating} onOpenChange={setCreating} />
      <MarkRefundPaidDialog refund={paying} open={payOpen} onOpenChange={setPayOpen} />
      <CancelRefundDialog refund={cancelling} open={cancelOpen} onOpenChange={setCancelOpen} />
    </section>
  );
}
