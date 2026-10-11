import { cn } from "cn";

import { utcToTehranParts, WEEKDAY_NAMES } from "~/lib/tehran-time";
import type { ScheduleSlot } from "~/orpc/assessment/contract";
import type { TrainerSession } from "~/orpc/enrollment/contract";
import { BookedSlot } from "~/routes/trainer_schedule/components/booked-slot";
import { OpenSlot } from "~/routes/trainer_schedule/components/open-slot";
import { SessionBlock } from "~/routes/trainer_schedule/components/session-block";
import type { SessionPosition } from "~/routes/trainer_schedule/session-positions";
import { jalaliDayMonth, weekDays } from "~/routes/trainer_schedule/week";

/*===== Week View =====*/
/**
 * Seven days, Saturday first (on the right in RTL). Desktop: columns separated by hairlines. Phones: an agenda, one
 * ruled row per day, and a day with nothing collapses to a single muted line. It is the same list in both, so the
 * reading order never differs.
 *
 * @param slots Only what is shown: open times still ahead, and booked ones. The caller drops the rest.
 * @param sessions The training sessions of the week, shown among the slots by time.
 * @param positions Where each session sits in its course, by session id.
 */
export function WeekView({
  weekStart,
  today,
  slots,
  sessions,
  positions,
}: {
  weekStart: string;
  /** `YYYY-MM-DD` in Tehran, to mark today's head. */
  today: string;
  slots: readonly ScheduleSlot[];
  sessions: readonly TrainerSession[];
  positions: Record<string, SessionPosition>;
}) {
  const days = weekDays(weekStart);

  return (
    <ol className="divide-y border-y lg:grid lg:grid-cols-7 lg:divide-x lg:divide-y-0 lg:border-y-0 lg:border-t">
      {days.map((date, index) => {
        // Slots and sessions share the day's column, in the order the trainer will meet them.
        const entries = [
          ...slots
            .filter((slot) => utcToTehranParts(slot.startsAt).date === date)
            .map((slot) => ({ key: slot.id, startsAt: slot.startsAt, slot, session: null })),
          ...sessions
            .filter((session) => utcToTehranParts(session.startsAt).date === date)
            .map((session) => ({ key: session.id, startsAt: session.startsAt, slot: null, session })),
        ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
        const isToday = date === today;
        const empty = entries.length === 0;

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
                {entries.map(({ key, slot, session }) => (
                  <li key={key}>
                    {session ? (
                      <SessionBlock session={session} position={positions[session.id]} />
                    ) : slot.assessment ? (
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
