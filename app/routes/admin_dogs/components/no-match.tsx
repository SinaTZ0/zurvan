import { cn } from "cn";
import { PawPrintIcon, SearchXIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "~/components/ui/button";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { DogStateFilter } from "~/routes/admin_dogs/search-params";

/*===== Constants =====*/
/** A status pill with no dogs and no search: the register's own words for it. «all» never gets here (dogs exist). */
const EMPTY_FILTERS: Record<Exclude<DogStateFilter, "all">, string> = {
  none: "همه‌ی سگ‌ها ارزیابی شدن",
  evaluated: "هنوز سگی ارزیابی نشده",
};

/*===== No Match =====*/
/**
 * The register when the search or the pill leaves no row: `AdminEmptyState`'s dashed plate (a place where rows will
 * be), with the way out beside the words, since this emptiness is his own filter and not the center's.
 *
 * - **A search with no dog:** «سگی با «…» پیدا نشد» and «پاک کردن جستجو».
 * - **A search that finds dogs under «همه» only:** says how many, with «توی همه ببین» first and the clear button after.
 * - **A pill with no dog** (no search): one calm line for that status.
 */
export function NoMatch({
  query,
  searching,
  state,
  matchesInAll,
  onClear,
  onShowAll,
  className,
}: {
  query: string;
  /** Whether the query filters anything (spaces alone don't). */
  searching: boolean;
  state: DogStateFilter;
  /** How many dogs the same search finds under «همه». */
  matchesInAll: number;
  onClear: () => void;
  onShowAll: () => void;
  className?: string;
}) {
  const titleId = useId();
  const elsewhere = searching && state !== "all" && matchesInAll > 0;
  const Icon = searching ? SearchXIcon : PawPrintIcon;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border bg-sunken/60 paper-grain px-6 py-9 text-center sm:flex-row sm:gap-6 sm:px-8 sm:text-start",
        ADMIN_TEAR,
        className,
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground">
        <Icon aria-hidden strokeWidth={1.5} className="size-6" />
      </span>

      {/*------ Words ------*/}
      <div className="min-w-0 flex-1">
        <h2 className={cn(DISPLAY_HEADING, "text-xl text-balance break-words")} id={titleId}>
          {searching ? (
            <>
              سگی با «<bdi>{query.trim()}</bdi>» پیدا نشد
            </>
          ) : (
            EMPTY_FILTERS[state === "all" ? "none" : state]
          )}
        </h2>
        {searching && (
          <p className="mt-1.5 max-w-md text-sm leading-6 text-pretty text-muted-foreground">
            {elsewhere
              ? `این‌جا نیست، ولی توی «همه» ${formatNumberFa(matchesInAll)} سگ پیدا می‌شه.`
              : "یه تیکه از اسم سگ یا صاحبش، نژاد، شماره‌ی پرونده یا شماره‌ی تلفن رو امتحان کن."}
          </p>
        )}
      </div>

      {/*------ Way Out ------*/}
      {searching && (
        <div className="flex shrink-0 flex-wrap justify-center gap-2">
          {elsewhere && (
            <Button type="button" variant="outline" className="border-foreground/20 bg-transparent" onClick={onShowAll}>
              توی همه ببین
            </Button>
          )}
          <Button
            type="button"
            variant={elsewhere ? "ghost" : "outline"}
            className={cn(!elsewhere && "border-foreground/20 bg-transparent")}
            onClick={onClear}
          >
            پاک کردن جستجو
          </Button>
        </div>
      )}
    </section>
  );
}
