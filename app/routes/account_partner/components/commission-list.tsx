import { formatJalaliTimestamp } from "~/lib/jalali";
import { formatToman } from "~/lib/course-format";

/*===== Types =====*/
export type PartnerCommissionRow = {
  id: string;
  customerName: string;
  /** Rial. */
  amount: number;
  paidAt: Date | null;
  createdAt: Date;
};

/*===== Commission List =====*/
/**
 * One row per commission, newest first. The name and date share the first line and the amount and status the second, so
 * a long name wraps on its own line and the amount never gets pushed off the card.
 */
export function CommissionList({ commissions }: { commissions: PartnerCommissionRow[] }) {
  if (commissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-pretty text-muted-foreground">
        هنوز پورسانتی نیست. وقتی مشتری‌ات اولین خریدش را کرد، اینجا می‌نشیند.
      </div>
    );
  }

  return (
    <ul aria-label="فهرست پورسانت‌ها" className="flex flex-col gap-3">
      {commissions.map((commission) => {
        const { paidAt } = commission;

        return (
          <li key={commission.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 font-bold break-words">{commission.customerName}</p>
              <time dateTime={commission.createdAt.toISOString()} className="shrink-0 text-sm text-muted-foreground">
                {formatJalaliTimestamp(commission.createdAt)}
              </time>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="font-bold tabular-nums">{formatToman(commission.amount)}</span>
              {paidAt ? (
                <span className="rounded-full border border-primary/50 px-3 py-1 text-xs font-bold text-primary">
                  پرداخت شد · {formatJalaliTimestamp(paidAt)}
                </span>
              ) : (
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">منتظر پرداخت</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
