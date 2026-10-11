import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import {
  MEETING_PLACE_KIND_LABELS,
  TRAINING_GOAL_LABELS,
  type MeetingPlaceKind,
  type TrainingGoal,
} from "~/orpc/assessment/constants";
import type { AvailableSlot } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";

/*===== Slip =====*/
/**
 * The booking as it fills in (برگه‌ی ارزیابی): the dog, what for, where, and the chosen time set large. Empty lines read
 * as quiet placeholders. It sits on the sunken plate, like the Dog Form's preview, and holds the page's one gold-leaf
 * object, the booking button. Phones show the slip in the page flow without the button; their button is in the fixed
 * bar, so there is never a second gold button on screen.
 */
export function Slip({
  dog,
  goal,
  placeKind,
  place,
  slot,
  pending,
  blocked,
}: {
  dog: Pick<Dog, "name" | "photo"> | null;
  goal: TrainingGoal | null;
  placeKind: MeetingPlaceKind | null;
  place: string;
  slot: AvailableSlot | null;
  pending: boolean;
  /** There is nothing to book yet (no dog can book), so the button waits. */
  blocked: boolean;
}) {
  // The first line only: the slip is a summary, and a long address would push the button away.
  const placeLine = place.trim().split("\n")[0] ?? "";

  return (
    <div className="rounded-3xl bg-sunken p-5 shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)] lg:p-8">
      <h2 className="text-sm font-bold text-saffron-text">برگه‌ی ارزیابی</h2>

      <dl className="mt-4 divide-y">
        {/*------ Dog ------*/}
        <SlipLine label="سگ">
          {dog ? (
            <span className="flex items-center gap-3">
              <DogThumb dog={dog} />
              <span className="min-w-0 truncate text-lg font-extrabold">{dog.name}</span>
            </span>
          ) : (
            <Placeholder>هنوز سگی انتخاب نکرده‌ای</Placeholder>
          )}
        </SlipLine>

        {/*------ Goal ------*/}
        <SlipLine label="برای چه">
          {goal ? (
            <Filled valueKey={goal}>{TRAINING_GOAL_LABELS[goal]}</Filled>
          ) : (
            <Placeholder>انتخاب نکرده‌ای</Placeholder>
          )}
        </SlipLine>

        {/*------ Place ------*/}
        <SlipLine label="محل دیدار">
          {placeLine ? (
            <Filled valueKey={placeLine}>
              <span className="block text-pretty break-words">{placeLine}</span>
              {placeKind && (
                <span className="block text-sm font-medium text-muted-foreground">
                  {MEETING_PLACE_KIND_LABELS[placeKind]}
                </span>
              )}
            </Filled>
          ) : (
            <Placeholder>هنوز نشانی ننوشته‌ای</Placeholder>
          )}
        </SlipLine>

        {/*------ Time ------*/}
        <SlipLine label="وقت">
          {slot ? (
            <Filled valueKey={slot.id}>
              <span className="block text-sm text-muted-foreground">{formatSlotDay(slot.startsAt)}</span>
              <span className="block text-2xl font-extrabold tabular-nums">{formatSlotTime(slot.startsAt)}</span>
            </Filled>
          ) : (
            <Placeholder>هنوز وقتی انتخاب نکرده‌ای</Placeholder>
          )}
        </SlipLine>
      </dl>

      {/*------ Promise and Button ------*/}
      <p className="mt-5 text-pretty">با آرمان، رایگان، حدود ۶۰ دقیقه.</p>
      <Button type="submit" size="lg" disabled={pending || blocked} className="mt-4 hidden w-full lg:flex">
        {pending && <Spinner data-icon="inline-start" />}
        ارزیابی را رزرو کن
      </Button>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">تا قبل از شروع وقت می‌توانی لغوش کنی.</p>
    </div>
  );
}

/*===== Lines =====*/
function SlipLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-bold">{children}</dd>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>;
}

/** A filled line cross-fades in when its value changes: `key` restarts the animation. */
function Filled({ valueKey, children }: { valueKey: string; children: React.ReactNode }) {
  return (
    <span key={valueKey} className="block motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in">
      {children}
    </span>
  );
}
