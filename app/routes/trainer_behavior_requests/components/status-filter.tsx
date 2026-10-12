import { cn } from "cn";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";

/*===== Filters =====*/
// «در جریان» is what still needs Arman (waiting or a plan out); «پاسخ‌داده‌شده» is everything he has answered or the
// customer closed, so it leaves out only the waiting ones.
export const STATUS_FILTERS = ["open", "answered", "all"] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number];

const LABELS: Record<StatusFilter, string> = { open: "در جریان", answered: "پاسخ‌داده‌شده", all: "همه" };

/*===== Status Filter =====*/
/**
 * The filter as one bar of segments, made of links so the choice lives in the URL (`?status=`): a reload or a shared
 * link keeps it, and the loader does the filtering. The default view keeps the plain URL.
 */
export function StatusFilterBar({ current, counts }: { current: StatusFilter; counts: Record<StatusFilter, number> }) {
  return (
    <nav aria-label="فیلتر درخواست‌ها">
      <ul className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-input/60 bg-sunken p-1 sm:w-fit">
        {STATUS_FILTERS.map((filter) => {
          const active = filter === current;
          return (
            <li key={filter}>
              <Link
                to={filter === "open" ? "/trainer/behavior-requests" : `/trainer/behavior-requests?status=${filter}`}
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
