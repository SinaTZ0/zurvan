import { cn } from "cn";

import { commissionTierRanges, type CommissionTier } from "~/lib/business-rules";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Constants =====*/
/** The least a step is drawn at, as a share of the tallest, so a 1% step next to a 50% one is still a block. */
const MIN_HEIGHT = 0.15;

const percent = (value: number) => m.shared_commission_percent({ value: formatNumber(value) });

/*===== Commission Stairs =====*/
/**
 * The partner's commission steps (F7) drawn as a staircase: one gold block per step, a hair apart, each as tall as its
 * percent (from the floor, so 10% beside 18% looks it), the percent on top and the customers it covers underneath. The stairs climb in the reading direction, so
 * on the Persian pages from right to left. Used wherever the steps are shown: the Admin's editor (as its live
 * preview), the Partner Enquiry page and the partner's own dashboard.
 *
 * With `reached` (the partner's paying customers), the step their next customer lands on is the bright one, marked
 * «الان اینجایی»; the ones below it are dimmed and the ones above it are outlines still to climb. Without it, every
 * step is bright.
 *
 * Screen readers get the steps as a list of sentences («مشتری ۴: ۱۲٪»); the drawing is hidden from them.
 */
export function CommissionStairs({
  tiers,
  reached,
  className,
}: {
  tiers: readonly CommissionTier[];
  /** How many paying customers the partner has; omit to draw the steps alone. */
  reached?: number;
  className?: string;
}) {
  const ranges = commissionTierRanges(tiers);
  const tallest = Math.max(...tiers.map((tier) => tier.percent), 1);
  // The step the partner's *next* customer is written on, which is what he is working towards: the last one that
  // starts at or before that customer.
  let current: (typeof ranges)[number] | null = null;
  if (reached !== undefined) {
    for (const range of ranges) if (range.fromCustomer <= reached + 1) current = range;
  }

  return (
    <figure className={cn("min-w-0", className)}>
      {/*------ For Screen Readers ------*/}
      <ul aria-label={m.shared_commission_stairs_label()} className="sr-only">
        {ranges.map((range) => {
          const values = {
            from: formatNumber(range.fromCustomer),
            to: formatNumber(range.toCustomer ?? 0),
            percent: percent(range.percent),
          };
          return (
            <li key={range.fromCustomer}>
              {range.toCustomer === null
                ? m.shared_commission_stairs_sr_open(values)
                : range.toCustomer === range.fromCustomer
                  ? m.shared_commission_stairs_sr_one(values)
                  : m.shared_commission_stairs_sr_range(values)}
              {current === range && `، ${m.shared_commission_stairs_here()}`}
            </li>
          );
        })}
      </ul>

      {/*------ The Stairs ------*/}
      <div aria-hidden className="flex h-40 items-end gap-1 sm:h-44">
        {ranges.map((range, index) => {
          const isCurrent = current === range;
          const isBelow = current !== null && range.fromCustomer < current.fromCustomer;
          const isAbove = current !== null && range.fromCustomer > current.fromCustomer;
          const height = Math.max(MIN_HEIGHT, range.percent / tallest);

          return (
            <div key={range.fromCustomer} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              {isCurrent && (
                <span className="mb-1 self-center rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-bold whitespace-nowrap text-primary-foreground">
                  {m.shared_commission_stairs_here()}
                </span>
              )}
              <span
                className={cn(
                  "mb-1.5 text-center font-display text-lg leading-none font-black tabular-nums sm:text-xl",
                  isAbove ? "text-muted-foreground" : "text-primary",
                )}
              >
                {percent(range.percent)}
              </span>
              <div
                style={{ height: `${height * 100}%`, "--step-delay": `${index * 0.08}s` } as React.CSSProperties}
                className={cn(
                  "commission-step origin-bottom rounded-t-lg border-t-2",
                  isAbove
                    ? "border-x border-dashed border-foreground/25 bg-transparent"
                    : isBelow
                      ? "border-primary/40 bg-primary/25"
                      : "border-primary-foreground/40 bg-primary",
                )}
              />
            </div>
          );
        })}
      </div>

      {/*------ Who Each Step Is For ------*/}
      <div aria-hidden className="flex gap-1 border-t border-foreground/20 pt-1.5">
        {ranges.map((range) => (
          <span
            key={range.fromCustomer}
            className="min-w-0 flex-1 text-center text-xs font-bold text-muted-foreground tabular-nums"
          >
            {range.toCustomer === null
              ? m.shared_commission_stairs_range_open({ from: formatNumber(range.fromCustomer) })
              : range.toCustomer === range.fromCustomer
                ? formatNumber(range.fromCustomer)
                : m.shared_commission_stairs_range({
                    from: formatNumber(range.fromCustomer),
                    to: formatNumber(range.toCustomer),
                  })}
          </span>
        ))}
      </div>
      <figcaption aria-hidden className="mt-1 text-center text-xs text-muted-foreground/80">
        {m.shared_commission_stairs_axis()}
      </figcaption>
    </figure>
  );
}
