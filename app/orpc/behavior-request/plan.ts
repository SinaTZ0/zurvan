/*===== The Plan's Rules =====*/
// Pure: the services read the request and ask these. Browser-safe, so the screens can also tell a live plan from one that
// ran out.

// `status` is the stored text: a status this code doesn't know can't be paid.
type PlanState = {
  status: string;
  proposalExpiresAt: Date | null;
};

/** Whether a proposed plan's time to pay has run out (B13). The deadline itself is still payable. */
export function isPlanExpired({ plan, now }: { plan: Pick<PlanState, "proposalExpiresAt">; now: Date }): boolean {
  return plan.proposalExpiresAt !== null && plan.proposalExpiresAt.getTime() < now.getTime();
}

/**
 * Why a request's plan can't be paid right now, as a Persian sentence; null when it can. Paying checks this itself, so
 * correctness doesn't depend on any job having marked the request expired.
 */
export function planUnpayableReason({ plan, now }: { plan: PlanState; now: Date }): string | null {
  if (plan.status === "proposed") {
    return isPlanExpired({ plan, now }) ? "مهلت پرداخت این برنامه تمام شده؛ درخواست تازه‌ای بفرست." : null;
  }

  switch (plan.status) {
    case "paid":
      return "این برنامه را قبلاً پرداخت کرده‌ای.";
    case "expired":
      return "مهلت پرداخت این برنامه تمام شده؛ درخواست تازه‌ای بفرست.";
    case "declined":
      return "آرمان این درخواست را رد کرده است.";
    case "withdrawn":
      return "این درخواست را پس گرفته‌ای.";
    case "submitted":
      return "آرمان هنوز برنامه‌ای برای این درخواست نفرستاده است.";
    default:
      return "این درخواست پرداخت‌شدنی نیست.";
  }
}
