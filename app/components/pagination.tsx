import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";

/*===== Pagination =====*/
/**
 * Page numbers between a back and a forward arrow, centred under the grid. In RTL the pages run right to left, so
 * "next" points left. A hidden live line reads out the page that came up. Up to five pages are all shown; beyond that
 * the list is a window (first, last and the current page with its neighbours) with «…» in the gaps, so it still fits a
 * 390px screen however long the list grows (the SMS outbox runs to dozens of pages).
 */
export function Pagination({
  page,
  pageCount,
  onPick,
  label = "صفحه‌های دوره‌ها",
  className,
}: {
  /** 0-based. */
  page: number;
  pageCount: number;
  onPick: (page: number) => void;
  label?: string;
  className?: string;
}) {
  const arrow = cn(buttonVariants({ variant: "outline", size: "icon" }));
  const items = pageItems({ page, pageCount });

  return (
    <nav aria-label={label} className={cn("flex items-center justify-center gap-1 sm:gap-2", className)}>
      <button
        type="button"
        aria-label="صفحه‌ی قبل"
        disabled={page === 0}
        onClick={() => onPick(page - 1)}
        className={arrow}
      >
        <ChevronRightIcon aria-hidden />
      </button>

      <ol className="flex items-center gap-1 sm:gap-2">
        {items.map((index, position) => (
          <li key={`${position}-${index}`}>
            {index === "gap" ? (
              <span aria-hidden className="grid w-4 place-items-center text-muted-foreground">
                …
              </span>
            ) : (
              <button
                type="button"
                aria-label={`صفحه‌ی ${formatNumberFa(index + 1)}`}
                aria-current={index === page ? "page" : undefined}
                onClick={() => onPick(index)}
                className={cn(
                  "grid size-10 place-items-center rounded-full border text-sm font-extrabold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-11",
                  index === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {formatNumberFa(index + 1)}
              </button>
            )}
          </li>
        ))}
      </ol>

      <button
        type="button"
        aria-label="صفحه‌ی بعد"
        disabled={page === pageCount - 1}
        onClick={() => onPick(page + 1)}
        className={arrow}
      >
        <ChevronLeftIcon aria-hidden />
      </button>

      <p aria-live="polite" className="sr-only">
        صفحه‌ی {formatNumberFa(page + 1)} از {formatNumberFa(pageCount)}
      </p>
    </nav>
  );
}

/*===== Window =====*/
/** The page indexes to draw, with `"gap"` where pages are skipped. */
function pageItems({ page, pageCount }: { page: number; pageCount: number }): (number | "gap")[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index);

  const shown = [...new Set([0, page - 1, page, page + 1, pageCount - 1])]
    .filter((index) => index >= 0 && index < pageCount)
    // oxlint-disable-next-line unicorn/no-array-sort -- the project's TypeScript lib has no `toSorted`
    .sort((a, b) => a - b);

  return shown.flatMap((index, position) => {
    const previous = shown[position - 1];
    return previous !== undefined && index - previous > 1 ? (["gap", index] as const) : [index];
  });
}
