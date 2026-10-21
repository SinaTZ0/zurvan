import { CheckIcon } from "lucide-react";
import { cn } from "cn";

import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import type { DashboardOverview } from "~/orpc/dashboard/contract";

import { EvaluationCounter } from "./evaluation-counter";
import { LatestPurchases } from "./latest-purchases";
import { PaidNotEnrolledCounter } from "./paid-not-enrolled-counter";

/*===== Notch =====*/
// A half-round bite out of the plate's edge where the tear meets it: a disc of the page's own paper over the edge, the
// part outside the plate clipped away by the plate's `overflow-hidden`. The slip's vocabulary from Purchases.
const NOTCH = "pointer-events-none absolute size-5 rounded-full bg-background paper-grain";

/*===== Waiting Plate =====*/
/**
 * «منتظر توست», the one lit plate: the day's work on a slip. The stub holds the two counters, the lines hold the latest
 * purchases, torn apart by a dashed line with a notch at each end. Only a counter above zero is lit (gold), so on a
 * good day the stub is one calm sentence and the plate has no gold, while the purchases stay to call.
 *
 * From `xl` the stub is the start column (5/12) and the tear runs down beside it; below, the stub is the plate's head
 * and the tear runs across under it. Below `xl` the column beside the rail is too narrow for the split.
 */
export function WaitingPlate({ waiting }: { waiting: DashboardOverview["waiting"] }) {
  const { evaluationRequests, paidNotEnrolled, latestPurchases } = waiting;
  const goodDay = evaluationRequests === 0 && paidNotEnrolled.count === 0;

  return (
    <div className={cn(ADMIN_PLATE, "relative grid overflow-hidden xl:grid-cols-12")}>
      {/*===== Stub =====*/}
      <div className={cn("relative border-b-2 p-5 sm:p-6 xl:col-span-5 xl:border-e-2 xl:border-b-0", ADMIN_TEAR)}>
        {/*------ Notches ------*/}
        {/* Phones and tablets: the tear runs across under the stub (both bottom corners); from `xl` down its end side. */}
        <span
          aria-hidden
          className={`${NOTCH} -start-2.5 -bottom-2.5 xl:start-auto xl:-end-2.5 xl:-top-2.5 xl:bottom-auto`}
        />
        <span aria-hidden className={`${NOTCH} -end-2.5 -bottom-2.5`} />

        {goodDay ? (
          <GoodDay />
        ) : (
          <div className={cn("flex flex-col divide-y", ADMIN_HAIRLINE)}>
            <div className="pb-4">
              <EvaluationCounter count={evaluationRequests} />
            </div>
            <div className="pt-4">
              <PaidNotEnrolledCounter count={paidNotEnrolled.count} amount={paidNotEnrolled.amount} />
            </div>
          </div>
        )}
      </div>

      {/*===== Lines =====*/}
      <div className="min-w-0 xl:col-span-7">
        <LatestPurchases purchases={latestPurchases} />
      </div>
    </div>
  );
}

/*===== Good Day =====*/
/** Nothing waits: one calm sentence in ivory and the two facts behind it, with a line tick in an ink ring. No gold. */
function GoodDay() {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground">
        <CheckIcon aria-hidden strokeWidth={1.6} className="size-5" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-lg font-bold text-balance">امروز کاری منتظرت نیست</p>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          درخواستی منتظر جواب نیست و همه‌ی خریدها ثبت‌نام شدن.
        </p>
      </div>
    </div>
  );
}
