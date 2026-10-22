import { cn } from "cn";
import { useState } from "react";

import { formatNumberFa } from "~/lib/digits";

/*===== Nav Badge =====*/
/**
 * A small flat-gold count beside a page's label: work waiting in the Admin's rail and tab bar. `label` is what a screen
 * reader adds after the number. Nothing renders for 0: an empty badge would read as something to do.
 *
 * When the number changes while it is on screen (he answered something and the counts refetched), the badge pops
 * (`answer-pop`, keyed by the value). It never pops on its first render, so a page load or a sheet opening is still.
 * `className` places it elsewhere, e.g. small on a tab's icon.
 */
export function NavBadge({
  count,
  label = "در انتظار",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  // Derived during render, so the remounted badge already carries the pop on its first frame.
  const [shownCount, setShownCount] = useState(count);
  const [changed, setChanged] = useState(false);
  if (count !== shownCount) {
    setShownCount(count);
    setChanged(true);
  }

  if (!count) return null;
  return (
    <span
      key={count}
      className={cn(
        "ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums [--pop-origin:50%_50%]",
        changed && "answer-pop",
        className,
      )}
    >
      <span className="sr-only">، </span>
      {formatNumberFa(count)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
