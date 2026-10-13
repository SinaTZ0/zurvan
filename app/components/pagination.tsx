import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";

/*===== Pagination =====*/
/**
 * Page numbers between a back and a forward arrow, centred under the grid. In RTL the pages run right to left, so
 * "next" points left. A hidden live line reads out the page that came up.
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

  return (
    <nav aria-label={label} className={cn("flex items-center justify-center gap-2", className)}>
      <button
        type="button"
        aria-label="صفحه‌ی قبل"
        disabled={page === 0}
        onClick={() => onPick(page - 1)}
        className={arrow}
      >
        <ChevronRightIcon aria-hidden />
      </button>

      <ol className="flex items-center gap-2">
        {Array.from({ length: pageCount }, (_, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`صفحه‌ی ${formatNumberFa(index + 1)}`}
              aria-current={index === page ? "page" : undefined}
              onClick={() => onPick(index)}
              className={cn(
                "grid size-11 place-items-center rounded-full border text-sm font-extrabold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                index === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {formatNumberFa(index + 1)}
            </button>
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
