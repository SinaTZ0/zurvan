import { cn } from "cn";
import { SearchXIcon, UsersRoundIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "~/components/ui/button";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { RoleFilter, StatusFilter } from "~/routes/admin_users/search-params";

/*===== Copy =====*/
// A pill pair with nobody and no search, in the roll's own words. «همه/همه» never gets here (the Admin himself is on
// the roll).
const ROLE_NOUNS: Record<Exclude<RoleFilter, "all">, string> = {
  customer: "مشتری‌ای",
  partner: "همکاری",
  admin: "مدیری",
};

function emptyTitle({ role, status }: { role: RoleFilter; status: StatusFilter }): string {
  if (status === "blocked") return role === "all" ? "کسی مسدود نیست" : `هیچ ${ROLE_NOUNS[role]} مسدود نیست`;
  if (status === "active") return role === "all" ? "کسی فعال نیست" : `هیچ ${ROLE_NOUNS[role]} فعال نیست`;
  return role === "all" ? "کسی این‌جا نیست" : `${ROLE_NOUNS[role]} نیست`;
}

/*===== No Match =====*/
/**
 * The roll when the search or the pills leave no row: `AdminEmptyState`'s dashed plate (a place where rows will be),
 * with the way out beside the words, since this emptiness is his own filter and not the center's.
 *
 * - **A search with nobody:** «کسی با «…» پیدا نشد» and «پاک کردن جستجو».
 * - **A search that finds people under «همه» only:** says how many, with «توی همه ببین» first and the clear button after.
 * - **Pills with nobody** (no search): one calm line for that pair, and «توی همه ببین».
 */
export function NoMatch({
  query,
  searching,
  role,
  status,
  matchesInAll,
  onClear,
  onShowAll,
  className,
}: {
  query: string;
  /** Whether the query filters anything (spaces alone don't). */
  searching: boolean;
  role: RoleFilter;
  status: StatusFilter;
  /** How many people the same search finds with both pill rows on «همه». */
  matchesInAll: number;
  onClear: () => void;
  onShowAll: () => void;
  className?: string;
}) {
  const titleId = useId();
  const filtered = role !== "all" || status !== "all";
  const elsewhere = searching && filtered && matchesInAll > 0;
  const Icon = searching ? SearchXIcon : UsersRoundIcon;

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
        <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-xl text-balance break-words")}>
          {searching ? (
            <>
              کسی با «<bdi>{query.trim()}</bdi>» پیدا نشد
            </>
          ) : (
            emptyTitle({ role, status })
          )}
        </h2>
        {searching && (
          <p className="mt-1.5 max-w-md text-sm leading-6 text-pretty text-muted-foreground">
            {elsewhere
              ? `این‌جا نیست، ولی توی «همه» ${formatNumberFa(matchesInAll)} نفر پیدا می‌شه.`
              : "یه تیکه از اسم یا شماره‌ی موبایل رو امتحان کن؛ صفر اولش لازم نیست."}
          </p>
        )}
      </div>

      {/*------ Way Out ------*/}
      {(searching || filtered) && (
        <div className="flex shrink-0 flex-wrap justify-center gap-2">
          {(elsewhere || (!searching && filtered)) && (
            <Button type="button" variant="outline" className="border-foreground/20 bg-transparent" onClick={onShowAll}>
              توی همه ببین
            </Button>
          )}
          {searching && (
            <Button
              type="button"
              variant={elsewhere ? "ghost" : "outline"}
              className={cn(!elsewhere && "border-foreground/20 bg-transparent")}
              onClick={onClear}
            >
              پاک کردن جستجو
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
