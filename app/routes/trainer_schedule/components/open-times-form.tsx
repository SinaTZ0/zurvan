import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { describeApiFailure } from "~/lib/api-error";
import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { isoToJalali, isValidJalali, jalaliToIso } from "~/lib/jalali";
import { formatSlotDay, utcToTehranParts, WEEKDAY_NAMES } from "~/lib/tehran-time";
import {
  ASSESSMENT_DEFAULT_DURATION_MINUTES,
  ASSESSMENT_MAX_DURATION_MINUTES,
  ASSESSMENT_MIN_DURATION_MINUTES,
  MAX_SLOTS_PER_OPEN,
} from "~/orpc/assessment/constants";
import { client } from "~/orpc/client";
import { JalaliDateSelect } from "~/routes/trainer_schedule/components/jalali-date-select";
import {
  MAX_TIME_FIELDS,
  OPEN_WEEKS_OPTIONS,
  parseClockTime,
  planSlots,
} from "~/routes/trainer_schedule/open-times-plan";
import { jalaliDayMonth } from "~/routes/trainer_schedule/week";

/** One letter per weekday, Saturday first; the full name is the button's label. */
const WEEKDAY_LETTERS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

/*===== Open Times Form =====*/
/**
 * One composer for a single time and for repeating ones: weekdays, clock times, a start date and a number of weeks. A
 * live line says exactly what will happen before the trainer submits. Lives in a dialog on desktop and a bottom sheet
 * on phones.
 *
 * @param today `YYYY-MM-DD` in Tehran, the default start date.
 * @param onOpened Called after at least one time was opened, so the page can close the composer and refresh.
 */
export function OpenTimesForm({ today, onOpened }: { today: string; onOpened: () => void }) {
  /*------ State ------*/
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>(["17:00"]);
  const [start, setStart] = useState(() => isoToJalali(today));
  const [weeks, setWeeks] = useState(1);
  const [duration, setDuration] = useState(String(ASSESSMENT_DEFAULT_DURATION_MINUTES));
  const [alert, setAlert] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  // Judged once per opening: the API checks "the future" again against its own clock on submit.
  const [openedAt] = useState(() => new Date());

  /*------ Plan ------*/
  const parsedTimes = times.map(parseClockTime);
  const validTimes = parsedTimes.filter((time): time is string => time !== null);
  const hasBadTime = parsedTimes.some((time) => time === null);
  const durationMinutes = Number(toLatinDigits(duration));
  const durationValid =
    Number.isInteger(durationMinutes) &&
    durationMinutes >= ASSESSMENT_MIN_DURATION_MINUTES &&
    durationMinutes <= ASSESSMENT_MAX_DURATION_MINUTES;

  const startIso = isValidJalali(start) ? jalaliToIso(start) : null;
  const plan =
    startIso && validTimes.length > 0 && !hasBadTime
      ? planSlots({ weekdays, times: validTimes, startDate: startIso, weeks, now: openedAt })
      : { startsAt: [], past: 0 };
  const tooMany = plan.startsAt.length > MAX_SLOTS_PER_OPEN;
  const canSubmit = plan.startsAt.length > 0 && !tooMany && durationValid;

  /*------ Submit ------*/
  const open = useMutation({
    mutationFn: () => client.assessment.trainer.openSlots({ startsAt: plan.startsAt, durationMinutes }),
    onSuccess: ({ opened, skipped }) => {
      if (opened === 0) {
        setAlert("همه‌ی این وقت‌ها با وقت‌های قبلی‌ات هم‌پوشانی داشت و چیزی باز نشد.");
        return;
      }
      const overlap =
        skipped.length > 0 ? `؛ ${formatNumberFa(skipped.length)} تا با وقت‌های قبلی هم‌پوشانی داشت و باز نشد` : "";
      toast.add({ title: `${formatNumberFa(opened)} وقت باز شد${overlap}.`, type: "success" });
      onOpened();
    },
    onError: (error) => {
      const failure = describeApiFailure({ error, fallback: "باز نشد. دوباره امتحان کن." });
      setAlert(failure.message);
      setDurationError(failure.fields.durationMinutes ?? null);
    },
  });

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    setAlert(null);
    setDurationError(null);
    if (canSubmit) open.mutate();
  }

  function setTimeAt({ index, value }: { index: number; value: string }) {
    setTimes((current) => current.map((time, at) => (at === index ? value : time)));
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert message={alert ?? undefined} />

      {/*------ Weekdays ------*/}
      <FieldSet className="gap-3">
        <legend className="text-sm font-bold">روزها</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LETTERS.map((letter, weekday) => {
            const selected = weekdays.includes(weekday);
            return (
              <button
                key={letter}
                type="button"
                aria-pressed={selected}
                aria-label={WEEKDAY_NAMES[weekday]}
                title={WEEKDAY_NAMES[weekday]}
                onClick={() =>
                  setWeekdays((current) =>
                    selected ? current.filter((day) => day !== weekday) : [...current, weekday],
                  )
                }
                className={cn(
                  "grid h-11 place-items-center rounded-lg border text-base font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </FieldSet>

      {/*------ Clock Times ------*/}
      <FieldSet className="gap-3">
        <legend className="text-sm font-bold">ساعت</legend>
        <div className="flex flex-col gap-2">
          {times.map((time, index) => {
            const invalid = parseClockTime(time) === null;
            return (
              <div key={index} className="flex items-center gap-2">
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="17:00"
                  value={time}
                  aria-label={`ساعت ${formatNumberFa(index + 1)}`}
                  aria-invalid={invalid}
                  onChange={(event) => setTimeAt({ index, value: event.target.value })}
                  className="h-12 max-w-40 text-center font-bold tabular-nums"
                />
                {times.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`حذف ساعت ${formatNumberFa(index + 1)}`}
                    onClick={() => setTimes((current) => current.filter((_, at) => at !== index))}
                  >
                    <XIcon aria-hidden />
                  </Button>
                )}
              </div>
            );
          })}
          {hasBadTime && <FieldError>ساعت را مثل ۱۷:۰۰ بنویس.</FieldError>}
        </div>
        {times.length < MAX_TIME_FIELDS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start text-primary"
            onClick={() => setTimes((current) => [...current, ""])}
          >
            <PlusIcon aria-hidden data-icon="inline-start" />
            ساعت دیگر
          </Button>
        )}
      </FieldSet>

      {/*------ Start, Weeks, Length ------*/}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldSet className="gap-2 sm:col-span-2">
          <legend className="text-sm font-bold">از تاریخ</legend>
          <JalaliDateSelect
            labelPrefix="شروع"
            value={start}
            onChange={setStart}
            years={[isoToJalali(today).year, isoToJalali(today).year + 1]}
          />
        </FieldSet>
        <Field>
          <FieldLabel htmlFor="open-weeks">برای چند هفته</FieldLabel>
          <NativeSelect
            id="open-weeks"
            value={weeks}
            onChange={(event) => setWeeks(Number(event.target.value))}
            className="w-full"
          >
            {OPEN_WEEKS_OPTIONS.map((count) => (
              <NativeSelectOption key={count} value={count}>
                {formatNumberFa(count)} هفته
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field data-invalid={!durationValid || !!durationError}>
          <FieldLabel htmlFor="open-duration">مدت هر وقت (دقیقه)</FieldLabel>
          <Input
            id="open-duration"
            inputMode="numeric"
            autoComplete="off"
            value={duration}
            aria-invalid={!durationValid || !!durationError}
            onChange={(event) => setDuration(event.target.value)}
            className="tabular-nums"
          />
          {!durationValid && (
            <FieldError>
              مدت بین {formatNumberFa(ASSESSMENT_MIN_DURATION_MINUTES)} تا{" "}
              {formatNumberFa(ASSESSMENT_MAX_DURATION_MINUTES)} دقیقه باشد.
            </FieldError>
          )}
          {durationError && <FieldError>{durationError}</FieldError>}
        </Field>
      </div>

      {/*------ What Will Happen ------*/}
      <p aria-live="polite" className="min-h-12 border-s-2 border-primary/50 ps-3 text-sm text-pretty">
        <PlanLine weekdayCount={weekdays.length} hasBadTime={hasBadTime} plan={plan} tooMany={tooMany} />
      </p>

      <Button type="submit" disabled={!canSubmit || open.isPending} className="w-full sm:w-auto sm:self-end">
        {open.isPending && <Spinner data-icon="inline-start" />}
        باز کن
      </Button>
    </form>
  );
}

/*===== Plan Line =====*/
/** The live count: what submitting would open, or what is still missing. */
function PlanLine({
  weekdayCount,
  hasBadTime,
  plan,
  tooMany,
}: {
  weekdayCount: number;
  hasBadTime: boolean;
  plan: { startsAt: Date[]; past: number };
  tooMany: boolean;
}) {
  const { startsAt, past } = plan;
  const first = startsAt[0];
  const last = startsAt.at(-1);

  if (weekdayCount === 0) return "حداقل یک روز هفته را انتخاب کن.";
  if (hasBadTime) return "ساعت‌ها را درست بنویس تا شمرده شود.";
  if (!first || !last) return "در این بازه وقتی نمانده که در آینده باشد. تاریخ شروع را جلوتر ببر.";

  const count = formatNumberFa(startsAt.length);
  if (tooMany) {
    return `این ${count} وقت می‌شود و در هر بار حداکثر ${formatNumberFa(MAX_SLOTS_PER_OPEN)} وقت باز می‌شود. هفته‌ها یا ساعت‌ها را کمتر کن.`;
  }

  const firstDay = utcToTehranParts(first).date;
  const lastDay = utcToTehranParts(last).date;
  const range =
    firstDay === lastDay ? formatSlotDay(first) : `از ${formatSlotDay(first)} تا ${jalaliDayMonth(lastDay)}`;

  return (
    <>
      {count} وقت باز می‌شود، {range}.
      {past > 0 && <span className="block text-muted-foreground">ساعت‌های گذشته‌ی امروز باز نمی‌شود.</span>}
    </>
  );
}
