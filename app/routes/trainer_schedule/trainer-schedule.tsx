import { useState } from "react";

import { Button } from "~/components/ui/button";
import { utcToTehranParts } from "~/lib/tehran-time";
import { MAX_SCHEDULE_RANGE_DAYS } from "~/orpc/assessment/constants";
import type { ScheduleSlot } from "~/orpc/assessment/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { AwaitingOutcome } from "~/routes/trainer_schedule/components/awaiting-outcome";
import { OpenTimesDialog } from "~/routes/trainer_schedule/components/open-times-dialog";
import { ScheduleHeader } from "~/routes/trainer_schedule/components/schedule-header";
import { WeekView } from "~/routes/trainer_schedule/components/week-view";
import { resolveWeekStart, weekRange } from "~/routes/trainer_schedule/week";

import type { Route } from "./+types/trainer-schedule";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "برنامه‌ی من | آموزش K9" }];

/*===== Loader =====*/
const DAY_MS = 86_400_000;

export async function loader({ request }: Route.LoaderArgs) {
  const now = new Date();
  const today = utcToTehranParts(now).date;
  const weekStart = resolveWeekStart({ param: new URL(request.url).searchParams.get("week"), today });
  const api = createServerClient(request).assessment.trainer;

  // Two calls: the week on screen, and, for the to-do, everything up to now. An assessment that passed in an earlier
  // week still waits for its outcome, so the to-do can't depend on the week being viewed. The API reads at most 62 days
  // at a time; older ones are out of reach of this list.
  const [weekSlots, recentSlots] = await Promise.all([
    api.schedule(weekRange(weekStart)),
    api.schedule({ from: new Date(now.getTime() - MAX_SCHEDULE_RANGE_DAYS * DAY_MS), to: now }),
  ]);

  const waiting = recentSlots.filter(hasBookedAssessment);
  // Hide what can't be acted on: times that have passed without a booking, and slots that were closed.
  const shown = weekSlots.filter((slot) =>
    slot.status === "open" ? slot.startsAt.getTime() > now.getTime() : slot.assessment !== null,
  );

  return { weekStart, today, slots: shown, waiting };
}

/** A slot whose live assessment is still `booked`; the loader's range ends now, so its time has started. */
function hasBookedAssessment(
  slot: ScheduleSlot,
): slot is ScheduleSlot & { assessment: NonNullable<ScheduleSlot["assessment"]> } {
  return slot.assessment?.status === "booked";
}

/*===== Page =====*/
export default function TrainerSchedulePage({ loaderData }: Route.ComponentProps) {
  const { weekStart, today, slots, waiting } = loaderData;
  const [composerOpen, setComposerOpen] = useState(false);
  const openComposer = () => setComposerOpen(true);

  return (
    <div className="site-container flex flex-col gap-8 py-8 lg:gap-10 lg:py-12">
      <ScheduleHeader weekStart={weekStart} today={today} onOpenTimes={openComposer} />

      {/*===== Waiting for an Outcome =====*/}
      {waiting.length > 0 && <AwaitingOutcome slots={waiting} />}

      {/*===== The Week =====*/}
      <section aria-label="هفته" className="flex flex-col gap-4">
        {slots.length === 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            این هفته وقتی باز نکرده‌ای.
            <Button type="button" variant="link" className="h-auto p-0" onClick={openComposer}>
              وقت باز کن
            </Button>
          </p>
        )}
        <WeekView weekStart={weekStart} today={today} slots={slots} />
      </section>

      <OpenTimesDialog open={composerOpen} onOpenChange={setComposerOpen} today={today} />
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary() {
  return (
    <section aria-labelledby="schedule-error-title" className="site-container py-16">
      <h1 id="schedule-error-title" className="text-2xl font-extrabold">
        برنامه باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
    </section>
  );
}
