import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";

/*===== Count Badge =====*/
/**
 * The cart's count beside a nav label or on a tab's icon. It is keyed by the count, so it pops (`answer-pop`) when it
 * first appears after hydration and again when the number changes. Nothing renders for 0. `label` is what a screen
 * reader adds after the number.
 */
export function CountBadge({
  count,
  label = "مورد",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  if (!count) return null;
  return (
    <span
      key={count}
      className={cn(
        "answer-pop inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums",
        className,
      )}
    >
      <span className="sr-only">، </span>
      {formatNumberFa(count)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
