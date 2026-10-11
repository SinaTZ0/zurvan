import { cn } from "cn";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";

/*===== Filters =====*/
export const SHOW_FILTERS = ["live", "finished", "all"] as const;

export type ShowFilter = (typeof SHOW_FILTERS)[number];

const LABELS: Record<ShowFilter, string> = { live: "در جریان", finished: "تمام‌شده", all: "همه" };

/*===== Status Filter =====*/
/**
 * The filter as one bar of segments, in the look of `SegmentedChoice` but made of links: the choice lives in the URL
 * (`?show=`), so a reload or a shared link keeps it, and the loader does the filtering.
 */
export function StatusFilter({ current, counts }: { current: ShowFilter; counts: Record<ShowFilter, number> }) {
  return (
    <nav aria-label="فیلتر شاگردها">
      <ul className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-input/60 bg-sunken p-1 sm:w-fit">
        {SHOW_FILTERS.map((filter) => {
          const active = filter === current;
          return (
            <li key={filter}>
              <Link
                // The default view keeps the plain URL.
                to={filter === "live" ? "/trainer/enrollments" : `/trainer/enrollments?show=${filter}`}
                preventScrollReset
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-primary/40"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {LABELS[filter]}
                <span className="text-xs font-normal tabular-nums">{formatNumberFa(counts[filter])}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
