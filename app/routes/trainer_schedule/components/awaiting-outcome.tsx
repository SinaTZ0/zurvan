import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { ScheduleSlot } from "~/orpc/assessment/contract";

type WaitingSlot = ScheduleSlot & { assessment: NonNullable<ScheduleSlot["assessment"]> };

/*===== Awaiting Outcome =====*/
/**
 * Booked assessments whose time has passed and whose outcome isn't recorded: the trainer's real to-do, so it comes
 * before the week. Each row goes straight to the form.
 */
export function AwaitingOutcome({ slots }: { slots: readonly WaitingSlot[] }) {
  return (
    <section
      aria-labelledby="waiting-title"
      className="rounded-xl border border-s-4 border-s-primary bg-card px-4 py-4 shadow-xs lg:max-w-176 lg:px-5"
    >
      <h2 id="waiting-title" className="font-extrabold">
        منتظر نتیجه ({formatNumberFa(slots.length)})
      </h2>
      <ul className="mt-2 divide-y">
        {slots.map((slot) => (
          <li key={slot.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
            <DogTag name={slot.assessment.dog.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{slot.assessment.dog.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatSlotDay(slot.startsAt)}، <span className="tabular-nums">{formatSlotTime(slot.startsAt)}</span>
              </p>
            </div>
            <Link
              to={`/trainer/assessments/${slot.assessment.id}`}
              aria-label={`ثبت نتیجه‌ی ${slot.assessment.dog.name}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              نتیجه را ثبت کن
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
