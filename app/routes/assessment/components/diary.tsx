import { cn } from "cn";
import { PhoneIcon } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Link } from "~/components/link";
import { CENTER_PHONE } from "~/lib/contact";
import {
  type DiaryDay,
  type DiaryTime,
  RAIL_END_HOUR,
  RAIL_LABEL_HOURS,
  RAIL_START_HOUR,
  formatRailHour,
} from "~/routes/assessment/slots";

/*===== Diary =====*/
// Arman's open times as a ruled diary: one row per day that has any, the day at the start, then (on desktop) a rail from
// 9:00 to 21:00 with each time sitting at its hour, so mornings and evenings read at a glance. Phones don't have the
// width for a rail, so the same pills wrap under the day name. One set of pills serves both layouts, because two sets
// of radios with the same name would fight over one form value.

/** Where an hour sits on the rail, 0 to 100. */
function railPosition(hour: number) {
  return ((hour - RAIL_START_HOUR) / (RAIL_END_HOUR - RAIL_START_HOUR)) * 100;
}

const RAIL_HOURS = Array.from({ length: RAIL_END_HOUR - RAIL_START_HOUR + 1 }, (_, index) => RAIL_START_HOUR + index);

/** Shared by the label column, the axis and the rows, so the three line up. */
const ROW_GRID = "lg:grid lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:gap-x-6";

const PILL_FACE =
  "flex h-11 w-full min-w-[4.75rem] items-center justify-center rounded-full bg-card px-3 text-sm font-bold tabular-nums ring-1 ring-border transition-colors lg:h-10 lg:min-w-0 lg:px-0";

export type DiaryProps = {
  days: readonly DiaryDay[];
} & (
  | {
      /** Customers pick one time; it is the form's `slotId`. */
      mode: "pick";
      registration: UseFormRegisterReturn;
    }
  | {
      /** A visitor sees the same times; each leads to signing in. */
      mode: "readonly";
      signInHref: string;
    }
);

export function Diary(props: DiaryProps) {
  const { days } = props;

  if (days.length === 0) return <NoOpenTimes />;

  return (
    <div>
      {/*------ Hour Labels ------*/}
      <div aria-hidden className={cn("mb-1 hidden", ROW_GRID)}>
        <span />
        <div className="relative mx-6 h-5">
          {RAIL_LABEL_HOURS.map((hour) => (
            <span
              key={hour}
              className="absolute -ms-4 w-8 text-center text-xs text-muted-foreground tabular-nums"
              style={{ insetInlineStart: `${railPosition(hour)}%` }}
            >
              {formatRailHour(hour)}
            </span>
          ))}
        </div>
      </div>

      {/*------ Days ------*/}
      <ul className="divide-y border-y">
        {days.map((day) => (
          <li key={day.date} className={cn("flex flex-col gap-3 py-4 lg:items-center", ROW_GRID)}>
            <p className="flex items-baseline gap-2 lg:flex-col lg:items-start lg:gap-0.5">
              <span className="font-extrabold">{day.weekday}</span>
              <span className="text-sm text-muted-foreground">{day.dayMonth}</span>
            </p>

            <div
              className="relative flex flex-wrap gap-2 lg:mx-6 lg:block lg:h-[calc(var(--lanes)*2.75rem-0.25rem)]"
              style={{ "--lanes": day.laneCount } as React.CSSProperties}
            >
              {/*------ Rail ------*/}
              <div aria-hidden className="absolute inset-x-0 top-1/2 hidden h-px bg-border/60 lg:block" />
              {RAIL_HOURS.map((hour) => (
                <span
                  key={hour}
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 hidden w-px lg:block",
                    (RAIL_LABEL_HOURS as readonly number[]).includes(hour) ? "bg-border" : "bg-border/40",
                  )}
                  style={{ insetInlineStart: `${railPosition(hour)}%` }}
                />
              ))}

              {/*------ Times ------*/}
              {day.times.map((time) => (
                <DiaryPill key={time.slot.id} day={day} time={time} {...props} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/*===== Pill =====*/
function DiaryPill({ day, time, ...props }: { day: DiaryDay; time: DiaryTime } & DiaryProps) {
  // On the rail the pill's centre sits at its hour: its start edge goes there, half a pill back.
  const placement = "lg:absolute lg:start-[calc(var(--pos)*1%)] lg:top-[calc(var(--lane)*2.75rem)] lg:-ms-6 lg:w-12";
  // Variables rather than inline `top` and `inset-inline-start`: those would also shift the pills on phones, where they
  // are in flow.
  const style = { "--pos": time.position, "--lane": time.lane } as React.CSSProperties;

  if (props.mode === "readonly") {
    return (
      <Link
        to={props.signInHref}
        className={cn(placement, "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}
        style={style}
      >
        <span className={cn(PILL_FACE, "hover:ring-primary")}>{time.label}</span>
        <span className="sr-only">
          {day.weekday} {day.dayMonth}، برای رزرو وارد شو
        </span>
      </Link>
    );
  }

  return (
    <label className={cn("relative block", placement)} style={style}>
      <input type="radio" value={time.slot.id} className="peer sr-only" {...props.registration} />
      <span
        className={cn(
          PILL_FACE,
          "cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-primary hover:ring-primary",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
        )}
      >
        {time.label}
      </span>
      <span className="sr-only">
        {day.weekday} {day.dayMonth}
      </span>
    </label>
  );
}

/*===== No Open Times =====*/
function NoOpenTimes() {
  return (
    <div className="rounded-2xl bg-sunken px-5 py-6">
      <p className="text-pretty">این هفته‌ها وقت خالی ندارم. زنگ بزن تا با هم یک وقت پیدا کنیم.</p>
      <a
        href={`tel:${CENTER_PHONE.tel}`}
        className="mt-3 inline-flex items-center gap-2 font-extrabold text-primary underline-offset-4 hover:underline"
      >
        <PhoneIcon aria-hidden className="size-4" />
        <span dir="ltr">{CENTER_PHONE.display}</span>
      </a>
    </div>
  );
}
