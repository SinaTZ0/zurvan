import { cn } from "cn";

import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Count Badge =====*/
/**
 * The cart's count beside a nav label or on a tab's icon. It is keyed by the count, so it pops (`answer-pop`) when it
 * first appears after hydration and again when the number changes. Nothing renders for 0. A screen reader hears it
 * as part of the tab's name («سبد، ۳ مورد», "Cart, 3 items").
 */
export function CountBadge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      key={count}
      className={cn(
        "answer-pop inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums",
        className,
      )}
    >
      <span aria-hidden>{formatNumber(count)}</span>
      <span className="sr-only">
        {count === 1
          ? m.layout_account_count_one({ count: formatNumber(count) })
          : m.layout_account_count_other({ count: formatNumber(count) })}
      </span>
    </span>
  );
}
