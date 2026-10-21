import { cn } from "cn";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { ADMIN_HAIRLINE } from "~/lib/admin-plate";
import { formatToman } from "~/lib/course-format";
import { sumStanding } from "~/lib/refund-format";
import type { AdminPayment } from "~/orpc/checkout/contract";
import type { Refund } from "~/orpc/refund/contract";

import { CreateRefundDialog } from "./create-refund-dialog";
import { CancelRefundDialog, MarkRefundPaidDialog } from "./refund-answer-dialogs";
import { RefundRow } from "./refund-row";

/*===== Refund Section =====*/
/**
 * The refunds of one paid payment (docs/app-spec.md, F5), at the foot of the slip under a double rule like a receipt's
 * total: what can still be given back, «ثبت بازپرداخت» to record a new one, and each refund with its state. Every step
 * asks first or says what it did; nothing here moves money, which is sent outside the app.
 *
 * Motion: when what can be given back changes while the page is open (a refund recorded or cancelled), the amount pops
 * (`answer-pop`, keyed by value), and a refund that wasn't there when the slip was drawn rises in.
 */
export function RefundSection({ payment, refunds }: { payment: AdminPayment; refunds: readonly Refund[] }) {
  const remaining = payment.amount - sumStanding(refunds);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<Refund | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Refund | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  /*------ What Was Here First ------*/
  // Only what changes after the slip is drawn moves; nothing animates on load.
  const [firstRemaining] = useState(remaining);
  const [firstIds] = useState(() => new Set(refunds.map((entry) => entry.id)));

  return (
    <section aria-label="بازپرداخت‌ها" className="mt-auto pt-2">
      <div className="border-t-[3px] border-double border-foreground/20 pt-3">
        {/*------ Head ------*/}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm">
            <span className="font-bold">بازپرداخت‌ها</span>
            <span className="text-muted-foreground"> · </span>
            <span
              key={remaining}
              style={{ "--pop-origin": "50% 50%" } as React.CSSProperties}
              className={cn("inline-block text-muted-foreground", remaining !== firstRemaining && "answer-pop")}
            >
              {remaining > 0 ? (
                <>
                  قابل بازپرداخت:{" "}
                  <span className="font-bold whitespace-nowrap text-foreground">{formatToman(remaining)}</span>
                </>
              ) : (
                "چیزی برای بازپرداخت نمونده"
              )}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-sm:h-11 max-sm:px-5"
            disabled={remaining <= 0}
            onClick={() => setCreating(true)}
          >
            ثبت بازپرداخت
          </Button>
        </div>

        {/*------ Refunds ------*/}
        {refunds.length > 0 && (
          <ul className={cn("mt-1 flex flex-col divide-y", ADMIN_HAIRLINE)}>
            {refunds.map((entry) => (
              <RefundRow
                key={entry.id}
                refund={entry}
                items={payment.items}
                arrived={!firstIds.has(entry.id)}
                onPay={() => {
                  setPaying(entry);
                  setPayOpen(true);
                }}
                onCancel={() => {
                  setCancelling(entry);
                  setCancelOpen(true);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <CreateRefundDialog payment={payment} remaining={remaining} open={creating} onOpenChange={setCreating} />
      <MarkRefundPaidDialog refund={paying} open={payOpen} onOpenChange={setPayOpen} />
      <CancelRefundDialog refund={cancelling} open={cancelOpen} onOpenChange={setCancelOpen} />
    </section>
  );
}
