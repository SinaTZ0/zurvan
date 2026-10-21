import { cn } from "cn";
import { useState } from "react";

import { formatNumberFa } from "~/lib/digits";

/*===== Types =====*/
export type AdminFilterOption<Value extends string> = {
  value: Value;
  label: string;
  /** Shown beside the label. Left out when the page can't count it. */
  count?: number;
};

/*===== Admin Filter Pills =====*/
/**
 * The status filter of an Admin list, in the look of the partner's stage pills: one row of toggle pills, the chosen one
 * in flat gold, the others outlined in ink, each with its count in a small disc. The gold crossfades from the old pill
 * to the new one, and a count that changes under him (a row moved to another status) pops.
 *
 * It holds no state and doesn't call nuqs: the page passes the value and a callback, so the pills stay reusable. On
 * phones the row scrolls sideways and snaps to each pill instead of wrapping into a second line; from `sm` it wraps.
 */
export function AdminFilterPills<Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** The group's name for screen readers, e.g. «وضعیت». */
  label: string;
  options: readonly AdminFilterOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "-mx-4 flex min-w-0 snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-2 overflow-x-auto border-0 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border ps-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              "transition-[background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none",
              option.count === undefined ? "pe-4" : "pe-2",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-foreground/15 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined && <CountDisc count={option.count} selected={selected} />}
          </button>
        );
      })}
    </fieldset>
  );
}

/*===== Count Disc =====*/
/**
 * A pill's count in its small disc. Keyed by the number, it pops when the number changes while the pills are on
 * screen, never on their first render.
 */
function CountDisc({ count, selected }: { count: number; selected: boolean }) {
  // Derived during render, so the remounted disc carries the pop on its first frame.
  const [shownCount, setShownCount] = useState(count);
  const [changed, setChanged] = useState(false);
  if (count !== shownCount) {
    setShownCount(count);
    setChanged(true);
  }

  return (
    <span
      key={count}
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs tabular-nums [--pop-origin:50%_50%]",
        selected ? "bg-primary-foreground/15 text-primary-foreground" : "bg-foreground/10 text-foreground/75",
        changed && "answer-pop",
      )}
    >
      {formatNumberFa(count)}
    </span>
  );
}
