import { cn } from "cn";
import { ChevronLeftIcon, GlobeIcon, LockIcon, PlusIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliDate } from "~/lib/jalali";
import type { LogbookEntry } from "~/orpc/logbook/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { useFreshRows } from "~/routes/admin_dog_detail/hooks/use-fresh-rows";
import { INK_OUTLINE, QUIET_LINE } from "~/routes/admin_dog_detail/surfaces";

/*===== Logbook Section =====*/
/**
 * The dog's diary (F14), newest session first as the API sends it, as rows on one plate: the day, the course (or
 * «بدون دوره») over the first words of the notes, and whether the session may show on the public record. A row is a
 * button that opens its sheet to correct it; «ثبت جلسه» writes a new one. Nothing here is ever deleted, so a correction
 * is an edit.
 *
 * The public mark is shown only while an owner can make a record public at all (`publicRecordsAvailable`), or on a
 * session already marked: otherwise every row would say «خصوصی» and the column would carry nothing.
 *
 * A session written here rises in (`answer-in`); one corrected here flashes once (`dd-flash`).
 */
export function LogbookSection({
  entries,
  publicRecordsAvailable,
  onAdd,
  onEdit,
}: {
  entries: LogbookEntry[];
  publicRecordsAvailable: boolean;
  onAdd: () => void;
  onEdit: (entry: LogbookEntry) => void;
}) {
  const fresh = useFreshRows({ rows: entries, id: (entry) => entry.id, version: (entry) => entry.updatedAt.getTime() });

  return (
    <DetailSection
      id="logbook"
      title="دفترچه‌ی تمرین"
      action={
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <span className="text-sm text-muted-foreground">{formatNumberFa(entries.length)} جلسه</span>
          )}
          <Button type="button" variant="outline" size="sm" className={cn(INK_OUTLINE, "px-3.5")} onClick={onAdd}>
            <PlusIcon aria-hidden />
            ثبت جلسه
          </Button>
        </div>
      }
    >
      {entries.length === 0 ? (
        <p className={QUIET_LINE}>هنوز جلسه‌ای ثبت نشده.</p>
      ) : (
        <ul className={cn(ADMIN_PLATE, "divide-y overflow-hidden", ADMIN_HAIRLINE)}>
          {entries.map((entry) => (
            <li key={entry.id} className={cn("relative", fresh.added.has(entry.id) && "answer-in")}>
              {/*------ Flash ------*/}
              {fresh.edited.has(entry.id) && (
                <span
                  key={entry.updatedAt.getTime()}
                  aria-hidden
                  className="dd-flash pointer-events-none absolute inset-0 bg-foreground/[0.07]"
                />
              )}
              <SessionRow
                entry={entry}
                showMark={publicRecordsAvailable || entry.isPublic}
                onOpen={() => onEdit(entry)}
              />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

/*===== Session Row =====*/
/**
 * One session as a row-sized button. Phones put the day and the mark on one line over the course and the notes; from
 * `sm` the day is a fixed start column so the dates line up.
 */
function SessionRow({ entry, showMark, onOpen }: { entry: LogbookEntry; showMark: boolean; onOpen: () => void }) {
  const day = formatJalaliDate(entry.occurredOn);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 text-start transition-colors outline-none hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.04] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:grid-cols-[7.5rem_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:px-5"
    >
      {/*------ Day ------*/}
      {/* The row's words are its name on a screen reader; it only needs to say what pressing it does. */}
      <span className="sr-only">ویرایش جلسه‌ی </span>
      <time dateTime={entry.occurredOn} className="text-sm font-bold whitespace-nowrap tabular-nums">
        {day}
      </time>

      {/*------ Course and Notes ------*/}
      <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <span className="block truncate text-sm font-bold">
          {entry.course ? entry.course.title : <span className="font-normal text-muted-foreground">بدون دوره</span>}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground" dir="auto">
          {entry.notes}
        </span>
      </span>

      {/*------ Public Mark ------*/}
      <span className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-3">
        {showMark && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {entry.isPublic ? (
              <GlobeIcon aria-hidden strokeWidth={1.8} className="size-3.5" />
            ) : (
              <LockIcon aria-hidden strokeWidth={1.8} className="size-3.5" />
            )}
            {entry.isPublic ? "عمومی" : "خصوصی"}
          </span>
        )}
        <ChevronLeftIcon aria-hidden className="size-4 text-muted-foreground sm:hidden" />
      </span>
      <ChevronLeftIcon aria-hidden className="hidden size-4 text-muted-foreground sm:col-start-4 sm:block" />
    </button>
  );
}
