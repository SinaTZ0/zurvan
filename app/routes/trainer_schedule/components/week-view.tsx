import { cn } from "cn";

import { utcToTehranParts, WEEKDAY_NAMES } from "~/lib/tehran-time";
import type { ScheduleSlot } from "~/orpc/assessment/contract";
import { BookedSlot } from "~/routes/trainer_schedule/components/booked-slot";
import { OpenSlot } from "~/routes/trainer_schedule/components/open-slot";
import { jalaliDayMonth, weekDays } from "~/routes/trainer_schedule/week";

/*===== Week View =====*/
/**
 * Seven days, Saturday first (on the right in RTL). Desktop: columns separated by hairlines. Phones: an agenda, one
 * ruled row per day, and a day with nothing collapses to a single muted line. It is the same list in both, so the
 * reading order never differs.
 *
 * @param slots Only what is shown: open times still ahead, and booked ones. The caller drops the rest.
 */
export function WeekView({
  weekStart,
  today,
  slots,
}: {
  weekStart: string;
  /** `YYYY-MM-DD` in Tehran, to mark today's head. */
  today: string;
  slots: readonly ScheduleSlot[];
}) {
  const days = weekDays(weekStart);

  return (
    <ol className="divide-y border-y lg:grid lg:grid-cols-7 lg:divide-x lg:divide-y-0 lg:border-y-0 lg:border-t">
      {days.map((date, index) => {
        const daySlots = slots.filter((slot) => utcToTehranParts(slot.startsAt).date === date);
        const isToday = date === today;
        const empty = daySlots.length === 0;

        return (
          <li
            key={date}
            className={cn(
              "grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-4 py-4 lg:flex lg:flex-col lg:gap-4 lg:px-3 lg:py-4",
              empty && "py-3 lg:py-4",
            )}
          >
            {/*------ Day Head ------*/}
            <div
              aria-current={isToday ? "date" : undefined}
              className={cn("w-fit border-b-2 border-transparent pb-1 lg:w-full", isToday && "border-primary")}
            >
              <p className="text-sm font-extrabold">{WEEKDAY_NAMES[index]}</p>
              <p className="text-sm text-muted-foreground">{jalaliDayMonth(date)}</p>
            </div>

            {/*------ Slots ------*/}
            {empty ? (
              <p aria-label="وقتی نیست" className="self-center text-muted-foreground lg:self-start">
                —
              </p>
            ) : (
              <ul className="flex min-w-0 flex-col gap-2">
                {daySlots.map((slot) => (
                  <li key={slot.id}>
                    {slot.assessment ? (
                      <BookedSlot slot={slot} assessment={slot.assessment} />
                    ) : (
                      <OpenSlot slot={slot} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
